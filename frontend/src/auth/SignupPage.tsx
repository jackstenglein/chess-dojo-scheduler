import { CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AuthStatus, useAuth } from './Auth';
import { useState } from 'react';
import { useRequest } from '../api/Request';
import { LoadingButton } from '@mui/lab';

const SignupPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();

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

    const onSignin = () => {
        const errors: Record<string, string> = {};
        if (name.length === 0) {
            errors.name = 'Name is required';
        }
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
        auth.signup(name, email, password)
            .then((result) => {
                navigate('/verify-email', {
                    state: {
                        username: result.user.username,
                        name,
                        email,
                        password,
                    },
                });
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <Stack alignItems='center'>
                    <Typography variant='h4'>Chess Dojo Scoreboard</Typography>
                    <Typography variant='h6'>Create Account</Typography>
                </Stack>

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
                        variant='contained'
                        fullWidth
                        sx={{ textTransform: 'none' }}
                        onClick={onSignin}
                        loading={request.isLoading()}
                    >
                        Create Account
                    </LoadingButton>
                    <Typography variant='body2' component='div' gutterBottom>
                        Already have an account? <Link to='/signin'>Sign In</Link>
                    </Typography>
                </Stack>
            </Stack>
        </Container>
    );
};

export default SignupPage;
