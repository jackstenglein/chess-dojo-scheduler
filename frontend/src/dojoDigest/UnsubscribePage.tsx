import { LoadingButton } from '@mui/lab';
import { Container, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import { unsubscribeFromDojoDigest } from '../api/dojoDigestApi';
import { AuthStatus, useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import { Navigate } from 'react-router-dom';

const UnsubscribePage = () => {
    const [email, setEmail] = useState('');
    const request = useRequest();
    const auth = useAuth();

    const onUnsubscribe = () => {
        if (email.trim().length === 0) {
            return;
        }

        request.onStart();
        unsubscribeFromDojoDigest(email)
            .then((resp) => {
                console.log('unsubscribeFromDojoDigest: ', resp);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/profile/edit#notifications-email' replace={true} />;
    }

    if (request.status === RequestStatus.Success) {
        return (
            <Container maxWidth='md' sx={{ py: 4 }}>
                <Stack spacing={4}>
                    <Typography variant='h6'>Unsubscribe from Dojo Digest</Typography>

                    <Typography>
                        {email} has been unsubscribed. Please allow 24 hours for this
                        change to take effect.
                    </Typography>
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxWidth='md' sx={{ py: 4 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={4}>
                <Typography variant='h6'>Unsubscribe from Dojo Digest</Typography>

                <TextField
                    label='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <LoadingButton
                    variant='contained'
                    loading={request.isLoading()}
                    onClick={onUnsubscribe}
                >
                    Unsubscribe
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default UnsubscribePage;
