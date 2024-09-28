import { ChessDojoIcon } from '@/style/ChessDojoIcon'; // Assuming ChessDojoIcon is an SVG or MUI component
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
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
            return <Navigate to={decodeURIComponent(redirectUri)} />;
        }
        return <Navigate to='/profile' />;
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
        <Container maxWidth='sm' sx={{ pt: 10, pb: 4 }}>
            {/* Card for the login form */}
            <Card>
                <CardContent>
                    <Stack justifyContent='center' alignItems='center' spacing={4}>
                        <RequestSnackbar request={request} />

                        {/* ChessDojoIcon above the title */}
                        <ChessDojoIcon
                            fontSize='large'
                            sx={{
                                mb: 2,
                                width: '80px',
                                height: '80px',
                            }}
                        />

                        {/* Title Section */}
                        <Typography variant='h4' textAlign='center' data-cy='title'>
                            ChessDojo Training Program
                        </Typography>

                        {/* Form Section */}
                        <Stack width={1} spacing={4} alignItems='center'>
                            <TextField
                                fullWidth
                                id='email'
                                label='Email'
                                variant='outlined'
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <AccountCircle color='dojoOrange' />
                                        </InputAdornment>
                                    ),
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
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <Lock color='dojoOrange' />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <LoadingButton
                                data-cy='signin-button'
                                variant='contained'
                                fullWidth
                                color='dojoOrange'
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    padding: '12px 16px',

                                    '&:hover': {
                                        backgroundColor: '#115293',
                                    },
                                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                                    transition: 'all 0.3s ease',
                                }}
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
                                    color='dojoOrange'
                                >
                                    No account? Sign Up
                                </Button>
                                <Button
                                    data-cy='forgot-password-button'
                                    variant='text'
                                    sx={{ textTransform: 'none', alignSelf: 'end' }}
                                    onClick={() => navigate('/forgot-password')}
                                    color='dojoOrange'
                                >
                                    Forgot password?
                                </Button>
                            </Stack>

                            <GoogleButton onClick={onGoogleSignIn} />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
};

export default SigninPage;
