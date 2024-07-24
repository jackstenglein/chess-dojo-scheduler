import LoadingButton from '@mui/lab/LoadingButton';
import { CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RequestSnackbar, useRequest } from '../api/Request';
import { AuthStatus, useAuth } from './Auth';

const VerifyEmailPage = () => {
    const auth = useAuth();

    const locationState = useLocation().state as
        | { username: string; email: string; password: string }
        | undefined;

    const username = locationState?.username;
    const email = locationState?.email;
    const password = locationState?.password;

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState<string>();

    const submitRequest = useRequest();
    const codeRequest = useRequest<string>();

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

    if (!username || !email || !password) {
        return <Navigate to='/signup' replace />;
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
            .catch((err: { message?: string; code?: string }) => {
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
            .catch((err: { message?: string }) => {
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
                        ChessDojo Training Program
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
