'use client';

import { LoadingButton } from '@mui/lab';
import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Request } from '../api/Request';
import SellingPoint, { SellingPointStatus } from './SellingPoint';
import { getCurrency } from './locales';

const priceDataByCurrency: Record<string, { symbol: string; monthly: number; yearly: number }> = {
    USD: {
        symbol: '$',
        monthly: 15,
        yearly: 120,
    },
    EUR: {
        symbol: '€',
        monthly: 15,
        yearly: 120,
    },
    GBP: {
        symbol: '£',
        monthly: 15,
        yearly: 120,
    },
    INR: {
        symbol: '₹',
        monthly: 650,
        yearly: 5200,
    },
};

interface PriceMatrixProps {
    onSubscribe?: (interval: 'month' | 'year') => void;
    request?: Request;
    interval?: string;
    onFreeTier?: () => void;

    subscribeLink?: string;
    freeTierLink?: string;
}

const PriceMatrix: React.FC<PriceMatrixProps> = ({
    request,
    interval,
    onSubscribe,
    onFreeTier,
    subscribeLink,
    freeTierLink,
}) => {
    const [currency, setCurrency] = useState('USD');
    useEffect(() => {
        const lang = navigator.languages[0];
        setCurrency(getCurrency(lang));
    }, [setCurrency]);

    const priceData = priceDataByCurrency[currency || 'USD'] || priceDataByCurrency.USD;

    return (
        <>
            {(onFreeTier || freeTierLink) && (
                <Grid
                    size={{
                        xs: 12,
                        sm: 4,
                    }}
                >
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

                                    <Typography variant='h6'>{priceData.symbol}0</Typography>
                                </Stack>

                                <Stack spacing={1} flexGrow={1}>
                                    <SellingPoint
                                        description='No payment info required'
                                        status={SellingPointStatus.Included}
                                    />
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
                                    disabled={request?.isLoading()}
                                    color='subscribe'
                                    onClick={onFreeTier}
                                    href={freeTierLink}
                                >
                                    Continue for Free
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            )}
            <Grid
                size={{
                    xs: 12,
                    sm: onFreeTier || freeTierLink ? 4 : 6,
                }}
            >
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

                                <Typography variant='h6'>
                                    {priceData.symbol}
                                    {priceData.monthly} / month
                                </Typography>
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
                                loading={request?.isLoading() && interval === 'month'}
                                disabled={request?.isLoading() && interval !== 'month'}
                                onClick={onSubscribe ? () => onSubscribe('month') : undefined}
                                href={subscribeLink}
                                color='subscribe'
                            >
                                Subscribe
                            </LoadingButton>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid
                size={{
                    xs: 12,
                    sm: onFreeTier || freeTierLink ? 4 : 6,
                }}
            >
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

                                <Typography variant='h6'>
                                    {priceData.symbol}
                                    {priceData.yearly} / year
                                </Typography>
                            </Stack>

                            <Stack spacing={1} flexGrow={1}>
                                <SellingPoint
                                    description='All features from monthly membership'
                                    status={SellingPointStatus.Included}
                                />
                                <SellingPoint
                                    description={`Saves ${priceData.symbol}${priceData.monthly * 12 - priceData.yearly} / year compared to monthly membership`}
                                    status={SellingPointStatus.Included}
                                />
                            </Stack>

                            <LoadingButton
                                variant='contained'
                                fullWidth
                                loading={request?.isLoading() && interval === 'year'}
                                disabled={request?.isLoading() && interval !== 'year'}
                                onClick={onSubscribe ? () => onSubscribe('year') : undefined}
                                href={subscribeLink}
                                color='subscribe'
                            >
                                Subscribe
                            </LoadingButton>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </>
    );
};

export default PriceMatrix;
