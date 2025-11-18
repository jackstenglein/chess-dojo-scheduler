'use client';

import { SubscriptionTier } from '@/api/paymentApi';
import { Button, ButtonProps, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Request } from '../api/Request';
import SellingPoint, { SellingPointProps, SellingPointStatus } from './SellingPoint';
import { getCurrency } from './locales';

const priceDataByCurrency: Record<string, { symbol: string; month: number; year: number }> = {
    USD: {
        symbol: '$',
        month: 15,
        year: 10,
    },
    EUR: {
        symbol: '€',
        month: 15,
        year: 10,
    },
    GBP: {
        symbol: '£',
        month: 15,
        year: 10,
    },
    INR: {
        symbol: '₹',
        month: 650,
        year: 433,
    },
};

interface PriceMatrixProps {
    request?: Request;
    interval: 'month' | 'year';
    selectedTier?: SubscriptionTier;
    onSubscribe: (
        tier: SubscriptionTier.Basic | SubscriptionTier.GameReview,
        interval: 'month' | 'year',
        price: { currency: string; value: number },
    ) => void;
    onFreeTier?: () => void;
}

const PriceMatrix: React.FC<PriceMatrixProps> = ({
    request,
    interval,
    selectedTier,
    onSubscribe,
    onFreeTier,
}) => {
    const [currency, setCurrency] = useState('USD');
    useEffect(() => {
        const lang = navigator.languages[0];
        setCurrency(getCurrency(lang));
    }, [setCurrency]);

    const priceData = priceDataByCurrency[currency || 'USD'] || priceDataByCurrency.USD;

    return (
        <>
            {onFreeTier && (
                <Grid size={{ xs: 12, sm: 8.5, md: 4 }}>
                    <PriceCard
                        name='Free Tier'
                        price={{
                            value: 0,
                            symbol: priceData.symbol,
                            interval: '',
                        }}
                        sellingPoints={[
                            {
                                description: 'Limited training plans, 0-2500',
                                status: SellingPointStatus.Restricted,
                            },
                            {
                                description: 'Limited game database',
                                status: SellingPointStatus.Restricted,
                            },
                            {
                                description: 'Limited puzzles',
                                status: SellingPointStatus.Restricted,
                            },
                            {
                                description: 'Opening courses',
                                status: SellingPointStatus.Excluded,
                            },
                            {
                                description: 'Community forum access',
                                status: SellingPointStatus.Excluded,
                            },
                        ]}
                        buttonProps={{
                            disabled: request?.isLoading(),
                            onClick: onFreeTier,
                            children: 'Continue for Free',
                            variant: 'outlined',
                            color: 'primary',
                        }}
                    />
                </Grid>
            )}

            <Grid size={{ xs: 12, sm: 8.5, md: onFreeTier ? 4 : 6 }}>
                <PriceCard
                    name='ChessDojo Self-Guided'
                    price={{
                        fullValue: interval === 'year' ? priceData.month : undefined,
                        value: priceData[interval],
                        symbol: priceData.symbol,
                        interval: `month${interval === 'year' ? '*' : ''}`,
                    }}
                    sellingPoints={[
                        {
                            description: 'All training plans, 0-2500',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Rating dashboard & progress tracking',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Full game database',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Unlimited puzzles',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'All opening courses',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Community forum access',
                            status: SellingPointStatus.Included,
                        },
                    ]}
                    buttonProps={{
                        loading: request?.isLoading() && selectedTier === SubscriptionTier.Basic,
                        disabled: request?.isLoading() && selectedTier !== SubscriptionTier.Basic,
                        onClick: () =>
                            onSubscribe(SubscriptionTier.Basic, interval, {
                                currency,
                                value: priceData[interval],
                            }),
                        children: 'Start Training',
                    }}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 8.5, md: onFreeTier ? 4 : 6 }}>
                <PriceCard
                    name='ChessDojo Live Training'
                    price={{
                        value: 150,
                        symbol: '$',
                        interval: 'month',
                    }}
                    sellingPoints={[
                        {
                            description: 'All features from previous tiers',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Direct feedback from a sensei',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Personalized game review classes',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Weekly live group classes on specialized topics',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Access to recordings of all classes',
                            status: SellingPointStatus.Included,
                        },
                    ]}
                    buttonProps={{
                        loading:
                            request?.isLoading() && selectedTier === SubscriptionTier.GameReview,
                        disabled:
                            request?.isLoading() && selectedTier === SubscriptionTier.GameReview,
                        onClick: () =>
                            onSubscribe(SubscriptionTier.GameReview, 'month', {
                                currency: 'USD',
                                value: 150,
                            }),
                        children: 'Get Sensei Feedback',
                    }}
                />
            </Grid>
        </>
    );
};

export default PriceMatrix;

function PriceCard({
    name,
    price,
    sellingPoints,
    buttonProps,
}: {
    name: string;
    price: {
        fullValue?: number;
        value: number;
        symbol: string;
        interval: string;
    };
    sellingPoints: SellingPointProps[];
    buttonProps: ButtonProps;
}) {
    return (
        <Card variant='outlined' sx={{ height: 1 }}>
            <CardContent sx={{ height: 1 }}>
                <Stack alignItems='center' spacing={3} height={1}>
                    <Stack alignItems='center' gap={1}>
                        <Typography
                            variant='h6'
                            fontWeight='bold'
                            color='text.secondary'
                            textAlign='center'
                        >
                            {name}
                        </Typography>

                        <Typography variant='h4'>
                            {price.fullValue && (
                                <Typography
                                    variant='h5'
                                    component='span'
                                    sx={{ textDecoration: 'line-through', verticalAlign: 'middle' }}
                                    color='text.secondary'
                                >
                                    {price.symbol}
                                    {price.fullValue}
                                </Typography>
                            )}

                            <Typography
                                variant='h4'
                                component='span'
                                color={price.fullValue ? 'success' : undefined}
                            >
                                {' '}
                                {price.symbol}
                                {price.value}
                            </Typography>

                            {price.interval && (
                                <Typography variant='h6' component='span'>
                                    {' '}
                                    / {price.interval}
                                </Typography>
                            )}
                        </Typography>
                    </Stack>

                    <Stack spacing={1} flexGrow={1}>
                        {sellingPoints.map((sp) => (
                            <SellingPoint key={sp.description} {...sp} />
                        ))}
                    </Stack>

                    <Button variant='contained' fullWidth color='subscribe' {...buttonProps} />
                </Stack>
            </CardContent>
        </Card>
    );
}
