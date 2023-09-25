import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
    Container,
    Divider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import GoogleButton from 'react-google-button';

import { AuthStatus, useAuth } from './Auth';
import { RequestSnackbar, useRequest } from '../api/Request';

const SigninPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    if (auth.status === AuthStatus.Loading) {
        return (
            <Stack sx={{ pt: 6, pb: 4 }} justifyContent='center' alignItems='center'>
                <CircularProgress />
            </Stack>
        );
    }

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/' />;
    }

    const onSignin = () => {
        const errors: Record<string, string> = {};
        if (email.trim().length === 0) {
            errors.email = 'Email is required';
        }
        if (password.length === 0) {
            errors.password = 'Password is required';
        }

        setErrors(errors);
        if (Object.values(errors).length > 0) {
            return;
        }

        request.onStart();
        auth.signin(email.trim(), password).catch((err) => {
            console.error(err);
            if (
                err.code === 'NotAuthorizedException' ||
                err.code === 'UserNotFoundException'
            ) {
                setErrors({ password: 'Incorrect email or password' });
                request.onFailure({ message: 'Incorrect email or password' });
            } else {
                request.onFailure(err);
            }
        });
    };

    const onGoogleSignIn = () => {
        auth.socialSignin('Google');
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10, pb: 4 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <RequestSnackbar request={request} />
                <Stack alignItems='center'>
                    <Typography variant='h4' textAlign='center' data-cy='title'>
                        ChessDojo Scoreboard
                    </Typography>
                    <Typography variant='h6' data-cy='subtitle'>
                        Sign In
                    </Typography>

                    <Alert severity='warning' sx={{ mt: 2 }} data-cy='warning'>
                        This account is separate from your account on chessdojo.club. Do
                        not try to use your chessdojo.club account to login. You must
                        first create an account on this site to login.
                    </Alert>
                </Stack>

                <Stack width={0.75} spacing={4} alignItems='center'>
                    <TextField
                        fullWidth
                        id='email'
                        label='Email'
                        variant='outlined'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        error={!!errors.email}
                        helperText={errors.email}
                    />
                    <TextField
                        fullWidth
                        id='password'
                        label='Password'
                        type='password'
                        variant='outlined'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        error={!!errors.password}
                        helperText={errors.password}
                    />
                    <LoadingButton
                        data-cy='signin-button'
                        variant='contained'
                        fullWidth
                        sx={{ textTransform: 'none' }}
                        onClick={onSignin}
                        loading={request.isLoading()}
                    >
                        Sign In
                    </LoadingButton>
                    <Stack
                        direction='row'
                        justifyContent='space-between'
                        sx={{ width: 1 }}
                    >
                        <Button
                            data-cy='signup-button'
                            variant='text'
                            sx={{ textTransform: 'none' }}
                            onClick={() => navigate('/signup')}
                        >
                            No account? Sign Up
                        </Button>
                        <Button
                            data-cy='forgot-password-button'
                            variant='text'
                            sx={{ textTransform: 'none', alignSelf: 'end' }}
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot password?
                        </Button>
                    </Stack>
                    <Divider sx={{ width: 1 }}>Or</Divider>
                    <GoogleButton onClick={onGoogleSignIn} />
                </Stack>
            </Stack>
        </Container>
    );
};

export default SigninPage;
