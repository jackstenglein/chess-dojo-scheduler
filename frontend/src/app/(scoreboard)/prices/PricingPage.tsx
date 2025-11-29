'use client';

import { EventType, trackEvent } from '@/analytics/events';
import { metaInitiateCheckout } from '@/analytics/meta';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { getConfig } from '@/config';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import PriceMatrix, { onSubscribeFunc } from '@/upsell/PriceMatrix';
import {
    getSubscriptionTier,
    PaymentInfo,
    SubscriptionTier,
} from '@jackstenglein/chess-dojo-common/src/database/user';
import { Container, Grid, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';

const config = getConfig();

interface PricingPageProps {
    onFreeTier?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onFreeTier }) => {
    const { status, user } = useAuth();
    const api = useApi();
    const request = useRequest();
    const [tier, setTier] = useState<SubscriptionTier>();
    const [interval, setInterval] = useState<'month' | 'year'>('year');
    const { searchParams } = useNextSearchParams();
    const redirect = searchParams.get('redirect') || '';
    const router = useRouter();

    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    const onSubscribe: onSubscribeFunc = (tier, interval, price) => {
        if (!user) {
            router.push('/signup');
        }

        setTier(tier);
        request.onStart();

        const itemId = config.stripe.tiers[tier][interval];
        metaInitiateCheckout([itemId], price.currency, price.value);
        trackEvent(EventType.BeginCheckout, {
            currency: price.currency,
            value: price.value,
            items: [{ item_id: itemId, item_name: `Subscription - ${tier}` }],
        });

        if (
            isValidStripe(user?.paymentInfo) &&
            getSubscriptionTier(user) !== SubscriptionTier.Free
        ) {
            api.subscriptionManage(tier, interval)
                .then((resp) => {
                    window.location.href = resp.data.url;
                })
                .catch((err: unknown) => {
                    console.error(`subscriptionManage: `, err);
                    request.onFailure(err);
                });
        } else {
            api.subscriptionCheckout({
                tier,
                interval,
                successUrl: redirect,
                cancelUrl: redirect,
            })
                .then((resp) => {
                    window.location.href = resp.data.url;
                })
                .catch((err: unknown) => {
                    console.error('subscriptionCheckout: ', err);
                    request.onFailure(err);
                });
        }
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />
            <Grid container spacing={3} justifyContent='center' flexWrap='wrap'>
                <Grid
                    size={12}
                    sx={{
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        order: -1,
                    }}
                >
                    <Tabs
                        value={interval}
                        onChange={(_, v: 'month' | 'year') => setInterval(v)}
                        textColor='inherit'
                        sx={{
                            '& .MuiTabs-indicator': {
                                backgroundColor: 'var(--mui-palette-text-secondary)',
                            },
                        }}
                    >
                        <Tab label='Monthly' value='month' />
                        <Tab label='Yearly' value='year' />
                    </Tabs>
                </Grid>

                <Grid
                    size={12}
                    container
                    spacing={3}
                    justifyContent='center'
                    flexWrap={{ xs: 'wrap-reverse', md: 'wrap' }}
                >
                    <PriceMatrix
                        onSubscribe={onSubscribe}
                        request={request}
                        interval={interval}
                        selectedTier={tier}
                        onFreeTier={onFreeTier}
                        currentTier={getSubscriptionTier(user)}
                    />
                </Grid>

                <Grid textAlign='center' size={12}>
                    <Typography variant='body2' color='text.secondary'>
                        Plans automatically renew until canceled
                    </Typography>

                    {interval === 'year' && (
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                            *When billed annually
                        </Typography>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default PricingPage;

function isValidStripe(paymentInfo?: PaymentInfo): boolean {
    const customerId = paymentInfo?.customerId ?? '';
    return customerId !== '' && customerId !== 'WIX' && customerId !== 'OVERRIDE';
}
