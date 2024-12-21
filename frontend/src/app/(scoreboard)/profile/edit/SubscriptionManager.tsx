import { Link } from '@/components/navigation/Link';
import { OpenInNew } from '@mui/icons-material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { LoadingButton } from '@mui/lab';
import { Button, Divider, Stack, Typography } from '@mui/material';
import { useApi } from '../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../api/Request';
import { SubscriptionStatus, User } from '../../../../database/user';

interface SubscriptionManagerProps {
    user: User;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ user }) => {
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

    const isFreeTier = user.subscriptionStatus !== SubscriptionStatus.Subscribed;
    const paymentInfo = user.paymentInfo;

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />

            <Stack
                id='subscription'
                width={1}
                sx={{
                    scrollMarginTop: 'calc(var(--navbar-height) + 8px)',
                }}
            >
                <Typography variant='h5'>
                    <MonetizationOnIcon
                        sx={{ verticalAlign: 'middle', marginRight: '0.1em' }}
                    />{' '}
                    Subscription/Billing
                </Typography>
                <Divider />
            </Stack>

            {isFreeTier ? (
                <>
                    <Typography>Subscription Status: Free Tier</Typography>
                    <Button variant='contained' component={Link} href='/prices'>
                        View Prices
                    </Button>
                </>
            ) : (
                <>
                    <Typography>Subscription Status: Subscribed</Typography>

                    {paymentInfo?.customerId ? (
                        <LoadingButton
                            loading={request.isLoading()}
                            onClick={onManageSubscription}
                            variant='contained'
                            endIcon={<OpenInNew />}
                        >
                            Manage Subscription
                        </LoadingButton>
                    ) : (
                        <Button
                            variant='contained'
                            href='https://www.chessdojo.shop/account/my-subscriptions'
                            endIcon={<OpenInNew />}
                        >
                            Manage Subscription
                        </Button>
                    )}
                </>
            )}
        </Stack>
    );
};

export default SubscriptionManager;
