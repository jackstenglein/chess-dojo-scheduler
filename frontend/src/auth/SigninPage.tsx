import { ChessDojoIcon } from '@/style/ChessDojoIcon';
import { AccountCircle, Lock } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    InputAdornment,
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
        <Container maxWidth='sm' sx={{ pt: { xs: 4, sm: 10 }, pb: 4 }}>
            <RequestSnackbar request={request} />

            <Card
                sx={{
                    backgroundImage: { xs: 'none', sm: 'var(--Paper-overlay)' },
                    boxShadow: { xs: 'none', sm: 'var(--Paper-shadow)' },
                }}
            >
                <CardContent>
                    <Stack justifyContent='center' alignItems='center'>
                        <ChessDojoIcon
                            fontSize='large'
                            sx={{
                                mb: 2,
                                width: '80px',
                                height: '80px',
                            }}
                        />

                        <Typography
                            variant='h4'
                            textAlign='center'
                            data-cy='title'
                            mb={4}
                        >
                            ChessDojo
                        </Typography>

                        <Stack width={{ xs: 1, sm: 0.85 }} rowGap={3} alignItems='center'>
                            <TextField
                                fullWidth
                                id='email'
                                label='Email'
                                variant='outlined'
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <AccountCircle color='dojoOrange' />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
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
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Lock color='dojoOrange' />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <LoadingButton
                                data-cy='signin-button'
                                variant='contained'
                                fullWidth
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    padding: '12px 16px',
                                }}
                                onClick={onSignin}
                                loading={request.isLoading()}
                            >
                                Sign In
                            </LoadingButton>

                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                sx={{ width: 1, mt: -2 }}
                            >
                                <Button
                                    data-cy='signup-button'
                                    variant='text'
                                    sx={{ textTransform: 'none' }}
                                    onClick={() => navigate('/signup')}
                                >
                                    Sign Up
                                </Button>
                                <Button
                                    data-cy='forgot-password-button'
                                    variant='text'
                                    sx={{ textTransform: 'none', alignSelf: 'end' }}
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    Reset Password
                                </Button>
                            </Stack>

                            <GoogleButton
                                onClick={onGoogleSignIn}
                                style={{
                                    transform: 'scale(1.1)',
                                    transformOrigin: 'center',
                                    margin: '20px',
                                }}
                            />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
};

export default SigninPage;
