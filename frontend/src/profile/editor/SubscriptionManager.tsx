import { Divider, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { OpenInNew } from '@mui/icons-material';

import { PaymentInfo } from '../../database/user';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';

interface SubscriptionManagerProps {
    paymentInfo?: PaymentInfo;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ paymentInfo }) => {
    const request = useRequest();
    const api = useApi();

    const onManageSubscription = () => {
        request.onStart();
        api.subscriptionManage()
            .then((resp) => {
                window.location.href = resp.data.url;
            })
            .catch((err) => {
                console.error('subscriptionManage: ', err);
                request.onFailure(err);
            });
    };

    if (!paymentInfo || !paymentInfo.customerId) {
        return null;
    }

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />

            <Stack width={1}>
                <Typography variant='h5'>Subscription/Billing</Typography>
                <Divider />
            </Stack>

            <Typography>Subscription Status: Subscribed</Typography>
            <LoadingButton
                loading={request.isLoading()}
                onClick={onManageSubscription}
                variant='contained'
                endIcon={<OpenInNew />}
            >
                Manage Subscription
            </LoadingButton>
        </Stack>
    );
};

export default SubscriptionManager;
