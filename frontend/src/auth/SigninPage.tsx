import { LoadingButton } from '@mui/lab';
import {
    Button,
    CircularProgress,
    Container,
    Divider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import GoogleButton from 'react-google-button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RequestSnackbar, useRequest } from '../api/Request';
import { AuthStatus, useAuth } from './Auth';

const SigninPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const redirectUri = useSearchParams()[0].get('redirectUri');

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
        if (redirectUri) {
            window.location.href = decodeURIComponent(redirectUri);
            return;
        }
        window.location.href = '/profile';
        return;
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
        auth.signin(email.trim(), password).catch((err: { name?: string }) => {
            console.error(err);
            if (
                err.name === 'NotAuthorizedException' ||
                err.name === 'UserNotFoundException'
            ) {
                setErrors({ password: 'Incorrect email or password' });
                request.onFailure({ message: 'Incorrect email or password' });
            } else {
                request.onFailure(err);
            }
        });
    };

    const onGoogleSignIn = () => {
        auth.socialSignin('Google', redirectUri ? decodeURIComponent(redirectUri) : '');
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            onSignin();
        }
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10, pb: 4 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <RequestSnackbar request={request} />
                <Stack alignItems='center'>
                    <Typography variant='h4' textAlign='center' data-cy='title'>
                        ChessDojo Training Program
                    </Typography>
                    <Typography variant='h6' data-cy='subtitle'>
                        Sign In
                    </Typography>
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
                        onKeyDown={onKeyDown}
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
