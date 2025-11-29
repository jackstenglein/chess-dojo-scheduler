'use client';

import { Link } from '@/components/navigation/Link';
import { SubscriptionTier } from '@jackstenglein/chess-dojo-common/src/database/user';
import { Button, ButtonProps, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import { Request } from '../api/Request';
import SellingPoint, { SellingPointProps, SellingPointStatus } from './SellingPoint';
import { getCurrency } from './locales';

const priceDataByCurrency: Record<
    string,
    {
        symbol: string;
        [SubscriptionTier.Basic]: { month: number; year: number };
        [SubscriptionTier.Lecture]: { month: number; year: number };
        [SubscriptionTier.GameReview]: { month: number; year: number };
    }
> = {
    USD: {
        symbol: '$',
        [SubscriptionTier.Basic]: {
            month: 15,
            year: 10,
        },
        [SubscriptionTier.Lecture]: {
            month: 75,
            year: 75,
        },
        [SubscriptionTier.GameReview]: {
            month: 200,
            year: 200,
        },
    },
    EUR: {
        symbol: '€',
        [SubscriptionTier.Basic]: {
            month: 15,
            year: 10,
        },
        [SubscriptionTier.Lecture]: {
            month: 75,
            year: 75,
        },
        [SubscriptionTier.GameReview]: {
            month: 200,
            year: 200,
        },
    },
    GBP: {
        symbol: '£',
        [SubscriptionTier.Basic]: {
            month: 15,
            year: 10,
        },
        [SubscriptionTier.Lecture]: {
            month: 75,
            year: 75,
        },
        [SubscriptionTier.GameReview]: {
            month: 200,
            year: 200,
        },
    },
    INR: {
        symbol: '₹',
        [SubscriptionTier.Basic]: {
            month: 650,
            year: 433,
        },
        [SubscriptionTier.Lecture]: {
            month: 3250,
            year: 3250,
        },
        [SubscriptionTier.GameReview]: {
            month: 17925,
            year: 17925,
        },
    },
};

export type onSubscribeFunc = (
    tier: SubscriptionTier.Basic | SubscriptionTier.Lecture | SubscriptionTier.GameReview,
    interval: 'month' | 'year',
    price: { currency: string; value: number },
) => void;

interface PriceMatrixProps {
    request?: Request;
    interval: 'month' | 'year';
    selectedTier?: SubscriptionTier;
    onSubscribe: onSubscribeFunc;
    onFreeTier?: () => void;
    currentTier: SubscriptionTier;
}

const PriceMatrix: React.FC<PriceMatrixProps> = ({
    request,
    interval,
    selectedTier,
    onSubscribe,
    onFreeTier,
    currentTier,
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
                <Grid size={{ xs: 12, sm: 8.5, md: 6, lg: 'grow' }}>
                    <PriceCard
                        name='Free Tier'
                        price={{
                            value: 0,
                            symbol: priceData.symbol,
                            interval: '',
                            subtitle: ' ',
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
                        isCurrentTier={false}
                    />
                </Grid>
            )}

            <Grid size={{ xs: 12, sm: 8.5, md: onFreeTier ? 6 : 4, lg: 'grow' }}>
                <PriceCard
                    name='Core'
                    price={{
                        fullValue:
                            interval === 'year'
                                ? priceData[SubscriptionTier.Basic].month
                                : undefined,
                        value: priceData[SubscriptionTier.Basic][interval],
                        symbol: priceData.symbol,
                        interval: `month${interval === 'year' ? '*' : ''}`,
                        subtitle: ' ',
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
                                value: priceData[SubscriptionTier.Basic][interval],
                            }),
                        children: 'Start Training',
                    }}
                    isCurrentTier={currentTier === SubscriptionTier.Basic}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 8.5, md: onFreeTier ? 6 : 4, lg: 'grow' }}>
                <PriceCard
                    name='Group Classes'
                    price={{
                        value: priceData[SubscriptionTier.Lecture][interval],
                        symbol: priceData.symbol,
                        interval: `month`,
                        subtitle: `(~ ${priceData.symbol}${Math.round(priceData[SubscriptionTier.Lecture][interval] / 15)} / class)`,
                    }}
                    sellingPoints={[
                        {
                            description: 'Everything from previous tier',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Weekly live group classes on specialized topics',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Q&A sessions with Dojo coaches',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Structured homework assignments',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Access to recordings of all group classes',
                            status: SellingPointStatus.Included,
                        },
                    ]}
                    buttonProps={{
                        loading: request?.isLoading() && selectedTier === SubscriptionTier.Lecture,
                        disabled: request?.isLoading() && selectedTier !== SubscriptionTier.Lecture,
                        onClick: () =>
                            onSubscribe(SubscriptionTier.Lecture, 'month', {
                                currency,
                                value: priceData[SubscriptionTier.Lecture][interval],
                            }),
                        children: 'Join Group Classes',
                    }}
                    afterButton={
                        <Link
                            target='_blank'
                            href='https://calendar.google.com/calendar/u/0/embed?src=c_771ab8bd3bcf653ae9cecfe549531b3894a17d052e5986da0bd3e1259e2778fc@group.calendar.google.com&mode=MONTH&dates=20260101/20260131&showPrint=0&showNav=0&showTabs=0&showCalendars=0'
                        >
                            View Full Class Calendar
                        </Link>
                    }
                    isCurrentTier={currentTier === SubscriptionTier.Lecture}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 8.5, md: onFreeTier ? 6 : 4, lg: 'grow' }}>
                <PriceCard
                    name='Game & Profile Review'
                    price={{
                        value: priceData[SubscriptionTier.GameReview][interval],
                        symbol: priceData.symbol,
                        interval: 'month',
                        subtitle: `(~ ${priceData.symbol}${Math.round(priceData[SubscriptionTier.GameReview][interval] / 20)} / class)`,
                    }}
                    sellingPoints={[
                        {
                            description: 'Everything from previous tiers',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Personalized game review classes',
                            status: SellingPointStatus.Included,
                        },
                        {
                            description: 'Direct feedback from a sensei',
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
                            request?.isLoading() && selectedTier !== SubscriptionTier.GameReview,
                        onClick: () =>
                            onSubscribe(SubscriptionTier.GameReview, 'month', {
                                currency,
                                value: priceData[SubscriptionTier.Lecture][interval],
                            }),
                        children: 'Get Sensei Feedback',
                    }}
                    afterButton={
                        <Link
                            target='_blank'
                            href='https://calendar.google.com/calendar/u/0/embed?src=c_771ab8bd3bcf653ae9cecfe549531b3894a17d052e5986da0bd3e1259e2778fc@group.calendar.google.com&mode=MONTH&dates=20260101/20260131&showPrint=0&showNav=0&showTabs=0&showCalendars=0'
                        >
                            View Full Class Calendar
                        </Link>
                    }
                    isCurrentTier={currentTier === SubscriptionTier.GameReview}
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
    afterButton,
    isCurrentTier,
}: {
    name: string;
    price: {
        fullValue?: number;
        value: number;
        symbol: string;
        interval: string;
        subtitle?: string;
    };
    sellingPoints: SellingPointProps[];
    buttonProps: ButtonProps;
    afterButton?: JSX.Element;
    isCurrentTier: boolean;
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
                                    {Math.round(price.fullValue * 100) / 100}
                                </Typography>
                            )}

                            <Typography
                                variant='h4'
                                component='span'
                                color={price.fullValue ? 'success' : undefined}
                            >
                                {' '}
                                {price.symbol}
                                {Math.round(price.value * 100) / 100}
                            </Typography>

                            {price.interval && (
                                <Typography variant='h6' component='span'>
                                    {' '}
                                    / {price.interval}
                                </Typography>
                            )}
                        </Typography>

                        <Typography variant='h6' mt={-1} color='text.secondary' whiteSpace='pre'>
                            {price.subtitle}
                        </Typography>
                    </Stack>

                    <Stack spacing={1} flexGrow={1}>
                        {sellingPoints.map((sp) => (
                            <SellingPoint key={sp.description} {...sp} />
                        ))}
                    </Stack>

                    {isCurrentTier ? (
                        <Button variant='contained' fullWidth disabled>
                            Already Subscribed
                        </Button>
                    ) : (
                        <Button variant='contained' fullWidth color='subscribe' {...buttonProps} />
                    )}

                    {afterButton}
                </Stack>
            </CardContent>
        </Card>
    );
}
