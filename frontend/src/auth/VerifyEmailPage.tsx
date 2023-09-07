import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Typography, Stack, TextField, CircularProgress, Container } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { AuthStatus, useAuth } from './Auth';
import { RequestSnackbar, useRequest } from '../api/Request';

const VerifyEmailPage = () => {
    const auth = useAuth();

    const navigate = useNavigate();
    const locationState = useLocation().state as any;

    const username: string = locationState?.username;
    const email: string = locationState?.email;
    const password: string = locationState?.password;

    useEffect(() => {
        if (!username || !email || !password) {
            navigate('/signup', { replace: true });
        }
    }, [username, email, password, navigate]);

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState<string>();

    const submitRequest = useRequest();
    const codeRequest = useRequest();

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

    const onSubmit = () => {
        if (code.length === 0) {
            setCodeError('Verification code is required');
            return;
        }
        setCodeError(undefined);

        submitRequest.onStart();

        auth.confirmSignup(username, code)
            .then(() => auth.signin(email, password))
            .catch((err) => {
                console.dir(err);
                if (err.message) {
                    setCodeError(err.message);
                }
                if (err.code === 'AliasExistsException') {
                    submitRequest.onFailure({
                        message:
                            'An account with this email already exists. ' +
                            'Note that if you previously signed in with Google, ' +
                            'you must continue to use that option.',
                    });
                } else {
                    submitRequest.onFailure(err);
                }
            });
    };

    const onResendCode = () => {
        codeRequest.onStart();

        auth.resendSignupCode(username)
            .then(() => {
                codeRequest.onSuccess('New verification code sent');
            })
            .catch((err) => {
                console.dir(err);
                if (err.message) {
                    codeRequest.onFailure(err.message);
                } else {
                    codeRequest.onFailure(err);
                }
            });
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <RequestSnackbar request={submitRequest} />
            <RequestSnackbar request={codeRequest} showSuccess />

            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <Stack alignItems='center'>
                    <Typography variant='h4' textAlign='center' data-cy='title'>
                        Chess Dojo Scoreboard
                    </Typography>
                    <Typography variant='h6' data-cy='subtitle'>
                        Verify Email
                    </Typography>
                </Stack>

                <Typography
                    variant='body1'
                    component='div'
                    gutterBottom
                    textAlign='center'
                    data-cy='description'
                >
                    In order to complete your account creation, please enter the
                    verification code sent to {email}.
                </Typography>

                <Stack width={0.75} spacing={4} alignItems='center'>
                    <TextField
                        fullWidth
                        id='code'
                        label='Verification Code'
                        variant='outlined'
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        onKeyDown={onKeyDown}
                        error={!!codeError}
                        helperText={codeError}
                    />

                    <LoadingButton
                        variant='contained'
                        loading={submitRequest.isLoading()}
                        fullWidth
                        sx={{ textTransform: 'none' }}
                        onClick={onSubmit}
                        data-cy='verify-button'
                    >
                        Verify Email
                    </LoadingButton>

                    <LoadingButton
                        variant='text'
                        sx={{ textTransform: 'none' }}
                        onClick={onResendCode}
                        loading={codeRequest.isLoading()}
                        data-cy='resend-button'
                    >
                        Send New Code
                    </LoadingButton>
                </Stack>
            </Stack>
        </Container>
    );
};

export default VerifyEmailPage;
