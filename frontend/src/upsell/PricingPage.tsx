import { useState } from 'react';
import { Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { LoadingButton } from '@mui/lab';
import { useSearchParams } from 'react-router-dom';

import SellingPoint, { SellingPointStatus } from './SellingPoint';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

interface PricingPageProps {
    onFreeTier?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onFreeTier }) => {
    const api = useApi();
    const request = useRequest();
    const [interval, setInterval] = useState('');
    const [searchParams, _] = useSearchParams();
    const redirect = searchParams.get('redirect') || '';

    const onSubscribe = (interval: 'month' | 'year') => {
        setInterval(interval);

        request.onStart();
        api.subscriptionCheckout({ interval, successUrl: redirect, cancelUrl: redirect })
            .then((resp) => {
                console.log('subscriptionCheckout: ', resp);
                window.location.href = resp.data.url;
            })
            .catch((err) => {
                console.error('subscriptionCheckout: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Container sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Grid2 container spacing={3}>
                <Grid2 xs={12} textAlign='center'>
                    <Typography variant='subtitle1' color='text.secondary'>
                        Choose your pricing plan
                    </Typography>
                </Grid2>

                {onFreeTier && (
                    <Grid2 xs={12} sm={4}>
                        <Card variant='outlined' sx={{ height: 1 }}>
                            <CardContent sx={{ height: 1 }}>
                                <Stack alignItems='center' spacing={3} height={1}>
                                    <Stack alignItems='center'>
                                        <Typography
                                            variant='subtitle1'
                                            fontWeight='bold'
                                            color='text.secondary'
                                            textAlign='center'
                                        >
                                            Free Tier
                                        </Typography>

                                        <Typography variant='h6'>$0</Typography>
                                    </Stack>

                                    <Stack spacing={1} flexGrow={1}>
                                        <SellingPoint
                                            description='Limited training plans, 0-2500'
                                            status={SellingPointStatus.Restricted}
                                        />
                                        <SellingPoint
                                            description='Limited Dojo games database'
                                            status={SellingPointStatus.Restricted}
                                        />
                                        <SellingPoint
                                            description='Opening courses'
                                            status={SellingPointStatus.Excluded}
                                        />
                                        <SellingPoint
                                            description='Private Discord server'
                                            status={SellingPointStatus.Excluded}
                                        />
                                    </Stack>

                                    <Button
                                        variant='contained'
                                        fullWidth
                                        disabled={request.isLoading()}
                                        color='subscribe'
                                        onClick={onFreeTier}
                                    >
                                        Continue for Free
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid2>
                )}

                <Grid2 xs={12} sm={onFreeTier ? 4 : 6}>
                    <Card variant='outlined' sx={{ height: 1 }}>
                        <CardContent sx={{ height: 1 }}>
                            <Stack alignItems='center' spacing={3} height={1}>
                                <Stack alignItems='center'>
                                    <Typography
                                        variant='subtitle1'
                                        fontWeight='bold'
                                        color='text.secondary'
                                        textAlign='center'
                                    >
                                        Training Program
                                    </Typography>

                                    <Typography variant='h6'>$15 / month</Typography>
                                </Stack>

                                <Stack spacing={1} flexGrow={1}>
                                    <SellingPoint
                                        description='All training plans, 0-2500'
                                        status={SellingPointStatus.Included}
                                    />
                                    <SellingPoint
                                        description='Full Dojo games database'
                                        status={SellingPointStatus.Included}
                                    />
                                    <SellingPoint
                                        description='All opening courses'
                                        status={SellingPointStatus.Included}
                                    />
                                    <SellingPoint
                                        description='Private Discord server'
                                        status={SellingPointStatus.Included}
                                    />
                                </Stack>

                                <LoadingButton
                                    variant='contained'
                                    fullWidth
                                    loading={request.isLoading() && interval === 'month'}
                                    disabled={request.isLoading() && interval !== 'month'}
                                    onClick={() => onSubscribe('month')}
                                    color='subscribe'
                                >
                                    Subscribe
                                </LoadingButton>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid2>

                <Grid2 xs={12} sm={onFreeTier ? 4 : 6}>
                    <Card variant='outlined' sx={{ height: 1 }}>
                        <CardContent sx={{ height: 1 }}>
                            <Stack alignItems='center' spacing={3} height={1}>
                                <Stack alignItems='center'>
                                    <Typography
                                        variant='subtitle1'
                                        fontWeight='bold'
                                        color='text.secondary'
                                        textAlign='center'
                                    >
                                        Training Program - Yearly
                                    </Typography>

                                    <Typography variant='h6'>$100 / year</Typography>
                                </Stack>

                                <Stack spacing={1} flexGrow={1}>
                                    <SellingPoint
                                        description='All features from monthly membership'
                                        status={SellingPointStatus.Included}
                                    />
                                    <SellingPoint
                                        description='Saves $80 / year compared to monthly membership'
                                        status={SellingPointStatus.Included}
                                    />
                                </Stack>

                                <LoadingButton
                                    variant='contained'
                                    fullWidth
                                    loading={request.isLoading() && interval === 'year'}
                                    disabled={request.isLoading() && interval !== 'year'}
                                    onClick={() => onSubscribe('year')}
                                    color='subscribe'
                                >
                                    Subscribe
                                </LoadingButton>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid2>

                <Grid2 xs={12} textAlign='center'>
                    <Typography variant='body2' color='text.secondary'>
                        Plans automatically renew until canceled
                    </Typography>
                </Grid2>
            </Grid2>
        </Container>
    );
};

export default PricingPage;
