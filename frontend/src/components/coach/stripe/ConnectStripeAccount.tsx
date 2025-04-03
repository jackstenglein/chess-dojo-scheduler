import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { OpenInNew } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Card, CardContent, CardHeader, Stack, Typography } from '@mui/material';

const ConnectStripeAccount = () => {
    const api = useApi();
    const request = useRequest();

    const onSetup = () => {
        request.onStart();

        api.createPaymentAccount()
            .then((response) => {
                window.location.href = response.data.url;
            })
            .catch((err) => {
                console.log('Create Payment Account: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Stack spacing={5}>
            <RequestSnackbar request={request} />

            <Card variant='outlined'>
                <CardHeader title='Setup Stripe Account' />
                <CardContent>
                    <Stack spacing={2} alignItems='start'>
                        <Typography>
                            ChessDojo uses Stripe to process payments. Before you can withdraw
                            funds, schedule lessons or create courses, you must setup your Stripe
                            account. Click the button below to be redirected to Stripe.
                        </Typography>

                        <LoadingButton
                            variant='contained'
                            loading={request.isLoading()}
                            onClick={onSetup}
                            endIcon={<OpenInNew />}
                        >
                            Setup Stripe
                        </LoadingButton>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default ConnectStripeAccount;
