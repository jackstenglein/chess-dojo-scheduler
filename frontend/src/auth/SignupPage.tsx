import { ChessDojoIcon } from '@/style/ChessDojoIcon';
import { AccountCircle, Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Card,
    CardContent,
    CircularProgress,
    Container,
    InputAdornment,
    Link,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import GoogleButton from 'react-google-button';
import {
    Navigate,
    Link as RouterLink,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';
import { RequestSnackbar, useRequest } from '../api/Request';
import { AuthStatus, useAuth } from './Auth';

const SignupPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const redirectUri = useSearchParams()[0].get('redirectUri');

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
        return <Navigate to='/profile' />;
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
                        username: result.username,
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
        auth.socialSignin('Google', redirectUri ? decodeURIComponent(redirectUri) : '');
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            onSignup();
        }
    };

    return (
        <Container maxWidth='sm' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={4}>
                <RequestSnackbar request={request} />

                <Card sx={{ width: 1 }}>
                    <CardContent>
                        <Stack alignItems='center' spacing={2}>
                            {/* ChessDojoIcon above the title */}
                            <ChessDojoIcon
                                fontSize='large'
                                sx={{
                                    mb: 2,
                                    width: '80px',
                                    height: '80px',
                                }}
                            />
                            <Typography variant='h4' textAlign='center' data-cy='title'>
                                ChessDojo Training Program
                            </Typography>

                            <Stack width={0.85} spacing={3} alignItems='center'>
                                <TextField
                                    fullWidth
                                    id='name'
                                    label='Name'
                                    variant='outlined'
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    onKeyDown={onKeyDown}
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
                                    id='email'
                                    label='Email'
                                    variant='outlined'
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    onKeyDown={onKeyDown}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <EmailIcon color='dojoOrange' />
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
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    onKeyDown={onKeyDown}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <LockIcon color='dojoOrange' />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <LoadingButton
                                    data-cy='submit-button'
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
                                    onClick={onSignup}
                                    loading={request.isLoading()}
                                >
                                    Create Account
                                </LoadingButton>

                                <GoogleButton
                                    onClick={onGoogleSignIn}
                                    label='Sign up with Google'
                                />
                                <Typography variant='body2' component='div' gutterBottom>
                                    Already have an account?{' '}
                                    <Link
                                        component={RouterLink}
                                        to='/signin'
                                        data-cy='signin-button'
                                    >
                                        Sign In
                                    </Link>
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default SignupPage;
