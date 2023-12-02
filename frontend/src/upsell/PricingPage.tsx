import { useState } from 'react';
import { Card, CardContent, Container, Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { LoadingButton } from '@mui/lab';

import SellingPoint from './SellingPoint';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

const PricingPage = () => {
    const api = useApi();
    const request = useRequest();
    const [interval, setInterval] = useState('');

    const onSubscribe = (interval: 'month' | 'year') => {
        setInterval(interval);

        request.onStart();
        api.subscriptionCheckout({ interval })
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

                <Grid2 xs={12} sm={6}>
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
                                        included
                                        description='All training plans, 0-2500'
                                    />
                                    <SellingPoint
                                        included
                                        description='All opening courses'
                                    />
                                    <SellingPoint
                                        included
                                        description='Private Discord server'
                                    />
                                    <SellingPoint
                                        included
                                        description='Full Dojo games database'
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

                <Grid2 xs={12} sm={6}>
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
                                        included
                                        description='All features from monthly membership'
                                    />
                                    <SellingPoint
                                        included
                                        description='Saves $80 / year compared to monthly membership'
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
