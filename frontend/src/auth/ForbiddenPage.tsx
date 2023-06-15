import { Container, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';

import { useAuth } from './Auth';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

const ForbiddenPage = () => {
    const auth = useAuth();
    const user = auth.user!;
    const api = useApi();
    const request = useRequest();
    const [wixEmail, setWixEmail] = useState(user.wixEmail);

    const onUpdate = () => {
        request.onStart();
        api.updateUser({ wixEmail })
            .then((resp) => {
                console.log('forbidden updateUser: ', resp);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Container maxWidth='sm' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <Stack alignItems='center'>
                <Typography variant='h4'>Access Denied</Typography>
                <Typography mt={4} textAlign='center'>
                    You must have an active subscription at{' '}
                    <a
                        href='https://chessdojo.club/plans-pricing'
                        target='_blank'
                        rel='noreferrer'
                    >
                        https://chessdojo.club
                    </a>{' '}
                    in order to access this site. If you do have an active subscription
                    and are seeing this page, then you are probably using a different
                    email on this site than you did on chessdojo.club. Enter the email you
                    use to log into chessdojo.club below:
                </Typography>

                <Stack direction='row' spacing={2} mt={5} alignItems='center' width={1}>
                    <TextField
                        label='ChessDojo.club Email'
                        value={wixEmail}
                        onChange={(e) => setWixEmail(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />

                    <LoadingButton
                        variant='contained'
                        loading={request.isLoading()}
                        onClick={onUpdate}
                    >
                        Update
                    </LoadingButton>
                </Stack>

                <Typography mt={5} textAlign='center'>
                    Note that if you have just started your subscription, it can take a
                    few minutes for access to be granted. If you still cannot log in and
                    think it is incorrect, contact either <strong>DMHokie</strong>{' '}
                    (discord: @dmhokie) or <strong>Jack</strong> (discord: @jackstenglein,
                    email: jackstenglein@gmail.com) for help.{' '}
                    <strong>Include in your message your emails for both sites.</strong>{' '}
                </Typography>
            </Stack>
        </Container>
    );
};

export default ForbiddenPage;
