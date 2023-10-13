import {
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
    Link,
    Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Link as RouterLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import GoogleButton from 'react-google-button';

import { AuthStatus, useAuth } from './Auth';
import { useState } from 'react';
import { RequestSnackbar, useRequest } from '../api/Request';

const SignupPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const redirectUri = useLocation().state?.redirectUri || '';

    const [name, setName] = useState('');
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

    const onSignup = () => {
        const errors: Record<string, string> = {};
        if (name.trim().length === 0) {
            errors.name = 'Name is required';
        }
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
        auth.signup(name.trim(), email.trim(), password)
            .then((result) => {
                navigate('/verify-email', {
                    state: {
                        username: result.user.username,
                        name: name.trim(),
                        email: email.trim(),
                        password,
                    },
                });
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const onGoogleSignIn = () => {
        auth.socialSignin('Google', redirectUri);
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <RequestSnackbar request={request} />

                <Stack alignItems='center'>
                    <Typography variant='h4' textAlign='center' data-cy='title'>
                        ChessDojo Scoreboard
                    </Typography>
                    <Typography variant='h6' data-cy='subtitle'>
                        Create Account
                    </Typography>
                </Stack>

                <GoogleButton onClick={onGoogleSignIn} label='Sign up with Google' />

                <Divider sx={{ width: 1 }}>Or</Divider>

                <Stack width={0.75} spacing={4} alignItems='center'>
                    <TextField
                        fullWidth
                        id='name'
                        label='Name'
                        variant='outlined'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                    />
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
                        data-cy='submit-button'
                        variant='contained'
                        fullWidth
                        sx={{ textTransform: 'none' }}
                        onClick={onSignup}
                        loading={request.isLoading()}
                    >
                        Create Account
                    </LoadingButton>
                    <Typography variant='body2' component='div' gutterBottom>
                        Already have an account?{' '}
                        <Link component={RouterLink} to='/signin' data-cy='signin-button'>
                            Sign In
                        </Link>
                    </Typography>
                </Stack>
            </Stack>
        </Container>
    );
};

export default SignupPage;
