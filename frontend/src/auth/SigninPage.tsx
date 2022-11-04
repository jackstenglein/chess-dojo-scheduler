import { Navigate, useNavigate } from 'react-router-dom';
import {
    Button,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { AuthStatus, useAuth } from './Auth';
import { useState } from 'react';
import { useRequest } from '../api/Request';

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
        return <Navigate to='/calendar' />;
    }

    const onSignin = () => {
        const errors: Record<string, string> = {};
        if (email.length === 0) {
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
        auth.signin(email, password).catch((err) => {
            console.error(err);
            request.onFailure(err);
            if (
                err.code === 'NotAuthorizedException' ||
                err.code === 'UserNotFoundException'
            ) {
                setErrors({ password: 'Incorrect email or password' });
            } else {
                setErrors({ password: err.message });
            }
        });
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <Stack alignItems='center'>
                    <Typography variant='h4'>Chess Dojo Scheduler</Typography>
                    <Typography variant='h6'>Signin</Typography>
                </Stack>

                <Stack width={0.75} spacing={4}>
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
                        variant='contained'
                        fullWidth
                        sx={{ textTransform: 'none' }}
                        onClick={onSignin}
                        loading={request.isLoading()}
                    >
                        Sign in
                    </LoadingButton>
                    <Stack
                        direction='row'
                        justifyContent='space-between'
                        sx={{ width: 1 }}
                    >
                        <Button
                            variant='text'
                            sx={{ textTransform: 'none' }}
                            onClick={() => navigate('/signup')}
                        >
                            No account? Sign Up
                        </Button>
                        <Button
                            variant='text'
                            sx={{ textTransform: 'none', alignSelf: 'end' }}
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot password?
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Container>
    );
};

export default SigninPage;
