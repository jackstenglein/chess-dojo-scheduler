'use client';

import { Graduation } from '@/database/graduation';
import { formatRatingSystem } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { ChessDojoIcon } from '@/style/ChessDojoIcon';
import { RatingSystemIcon } from '@/style/RatingSystemIcons';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Stack, Typography } from '@mui/material';
import { ReactNode, useMemo } from 'react';
import { AxisOptions, Chart, UserSerie } from 'react-charts';

interface Datum {
    date: Date;
    rating: number;
}

export const primaryAxis: AxisOptions<Datum> = {
    scaleType: 'time',
    getValue: (datum) => datum.date,
};

export const secondaryAxes: AxisOptions<Datum>[] = [
    {
        scaleType: 'linear',
        getValue: (datum) => datum.rating,
        formatters: {
            scale: (value) => `${value}`,
        },
    },
];

function getChartData(graduation: Graduation): UserSerie<Datum>[] {
    const { ratingSystem: preferredSystem } = graduation;

    const ratingHistory =
        graduation.ratingHistories?.[preferredSystem]?.map(({ date, rating }) => ({
            rating,
            date: new Date(date),
        })) ?? [];

    return [{ label: 'Rating', data: ratingHistory }];
}

function StatLabel({ children }: { children: ReactNode }) {
    return (
        <Typography
            component='span'
            fontSize='1rem'
            variant='subtitle2'
            color='text.secondary'
            sx={{
                textAlign: 'center',
            }}
        >
            {children}
        </Typography>
    );
}

function Stat({ label, value }: { label: string; value: number | string }) {
    return (
        <Stack>
            <StatLabel>{label}</StatLabel>
            <Typography
                sx={{
                    fontSize: '2.25rem',
                    lineHeight: 1,
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function ChangeStat({ label, value }: { label: string; value: number }) {
    return (
        <Stack>
            <StatLabel>{label}</StatLabel>
            <Stack direction='row' alignItems='start'>
                {value >= 0 ? (
                    <ArrowUpwardIcon
                        sx={{
                            fontSize: '2.25rem',
                            fontWeight: 'bold',
                            mt: '-3px',
                        }}
                        color='success'
                    />
                ) : (
                    <ArrowDownwardIcon
                        sx={{
                            fontSize: '2.25rem',
                            fontWeight: 'bold',
                            mt: '-3px',
                        }}
                        color='error'
                    />
                )}

                <Typography
                    alignContent='center'
                    sx={{
                        fontSize: '2.25rem',
                        lineHeight: 1,
                        fontWeight: 'bold',
                    }}
                    color={value >= 0 ? 'success.main' : 'error.main'}
                >
                    {Math.abs(value)}
                </Typography>
            </Stack>
        </Stack>
    );
}

interface GraduationCardProps {
    graduation: Graduation;
}

export default function GraduationCard({ graduation }: GraduationCardProps) {
    const {
        newCohort,
        ratingSystem: preferredSystem,
        score,
        progress,
        currentRating,
        startRating,
        displayName,
    } = graduation;

    const hours =
        Object.values(progress)
            .flatMap((reqProg) => Object.values(reqProg.minutesSpent))
            .reduce((a, b) => a + b, 0) / 60;

    const historyData = useMemo(() => getChartData(graduation), [graduation]);

    const finalRating = currentRating;
    const ratingChange = finalRating - startRating;

    return (
        <Box
            width='800px'
            height='540px'
            display='grid'
            gap='0.5rem'
            paddingY='32px'
            paddingX='64px'
            gridTemplateColumns='1fr auto auto'
            gridTemplateRows='auto max-content auto'
            gridTemplateAreas={[
                '"header header"',
                '"system-name blank"',
                '"chart dojo"',
                '"stats empty"',
            ].join('\n')}
        >
            <Stack
                direction='row'
                justifyContent='center'
                alignItems='center'
                columnGap='2ch'
                gridArea='header'
            >
                <Stack direction='row' columnGap='1ch' flexWrap='wrap'>
                    <Stack direction='row' columnGap='1ch' flexWrap='wrap'>
                        <Typography lineHeight={1} variant='h5'>
                            Congrats{' '}
                        </Typography>
                        <Typography lineHeight={1} variant='h5' color='dojoOrange.main'>
                            {' '}
                            {displayName}
                        </Typography>
                    </Stack>
                    <Stack direction='row' columnGap='1ch' flexWrap='wrap'>
                        <Typography lineHeight={1} variant='h5'>
                            on graduating to
                        </Typography>
                        <Typography color='dojoOrange.main' lineHeight={1} variant='h5'>
                            {newCohort}!
                        </Typography>
                    </Stack>
                </Stack>
                <CohortIcon size={40} cohort={newCohort} skipCache />
            </Stack>
            <Stack
                direction='row'
                alignContent='center'
                justifyContent='space-around'
                gridArea='stats'
            >
                <Stat label='Start' value={startRating} />
                <ChangeStat label='Progress' value={ratingChange} />
                <Stat label='Graduation' value={finalRating} />
            </Stack>
            <Stack direction='row' gridArea='system-name' spacing={1.5} alignItems='center'>
                <RatingSystemIcon system={preferredSystem} />
                <Typography variant='h6' sx={{ mb: -1 }}>
                    {formatRatingSystem(preferredSystem)}
                </Typography>
            </Stack>
            <Box display='grid' gridArea='chart'>
                <Chart
                    options={{
                        data: historyData,
                        primaryAxis,
                        secondaryAxes,
                        dark: true,
                        interactionMode: 'closest',
                        tooltip: false,
                    }}
                />
            </Box>
            <Stack alignContent='center' justifyContent='center' gridArea='dojo' spacing={2}>
                <Stat label='Dojo Points' value={Math.round(100 * score) / 100} />
                <Stat label='Dojo Hours' value={Math.round(10 * hours) / 10} />
                <Stack
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    spacing={1}
                    component='div'
                >
                    <Box fontSize='64px' width='64px' height='64px'>
                        <ChessDojoIcon fontSize='inherit' />
                    </Box>
                    <Typography variant='subtitle2'>ChessDojo</Typography>
                </Stack>
            </Stack>
        </Box>
    );
}
