import { OpenInNew } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Card, CardContent, CardHeader, Stack, Typography } from '@mui/material';

import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { StripeAccount } from '../../../database/payment';

const DashboardCard = ({ account }: { account?: StripeAccount }) => {
    const api = useApi();
    const request = useRequest();

    if (!account?.details_submitted) {
        return null;
    }

    const onDashboard = () => {
        request.onStart();

        api.paymentAccountLogin()
            .then((response) => {
                window.location.href = response.data.url;
            })
            .catch((err) => {
                console.error('paymentAccountLogin: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Card variant='outlined'>
            <RequestSnackbar request={request} />

            <CardHeader title='Stripe Dashboard' />
            <CardContent>
                <Stack spacing={2} alignItems='start'>
                    <Typography>
                        ChessDojo uses Stripe to process payments. Click the button below
                        to go to your Stripe dashboard, where you can see your current
                        balance, view upcoming payouts and track your earnings.
                    </Typography>

                    <LoadingButton
                        variant='contained'
                        loading={request.isLoading()}
                        onClick={onDashboard}
                        endIcon={<OpenInNew />}
                    >
                        Go to Dashboard
                    </LoadingButton>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default DashboardCard;
