import { Stack } from '@mui/material';
import { useEffect } from 'react';
import NotFoundPage from '../../../NotFoundPage';
import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { useRequiredAuth } from '../../../auth/Auth';
import { StripeAccount } from '../../../database/payment';
import LoadingPage from '../../../loading/LoadingPage';
import AccountStatusCard from './AccountStatusCard';
import DashboardCard from './DashboardCard';
import PayoutsCard from './PayoutsCard';

const StripeInfo = () => {
    const { user } = useRequiredAuth();
    const api = useApi();
    const request = useRequest<StripeAccount>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getPaymentAccount()
                .then((resp) => {
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error('getPaymentAccount: ', err);
                    request.onFailure(err);
                });
        }
    });

    if (!user.isCoach) {
        return <NotFoundPage />;
    }

    if (request.isLoading() || !request.isSent()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={3}>
            <RequestSnackbar request={request} />

            <DashboardCard account={request.data} />
            <AccountStatusCard account={request.data} />
            <PayoutsCard account={request.data} />
        </Stack>
    );
};

export default StripeInfo;
