import { useEffect } from 'react';
import { Stack } from '@mui/material';

import { useAuth } from '../../auth/Auth';
import NotFoundPage from '../../NotFoundPage';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { StripeAccount } from '../../database/payment';
import LoadingPage from '../../loading/LoadingPage';
import AccountStatusCard from './AccountStatusCard';
import PayoutsCard from './PayoutsCard';
import DashboardCard from './DashboardCard';

const StripeInfo = () => {
    const user = useAuth().user!;
    const api = useApi();
    const request = useRequest<StripeAccount>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getPaymentAccount()
                .then((resp) => {
                    console.log('getPaymentAccount: ', resp);
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

            <AccountStatusCard account={request.data} />
            <PayoutsCard account={request.data} />
            <DashboardCard />
        </Stack>
    );
};

export default StripeInfo;
