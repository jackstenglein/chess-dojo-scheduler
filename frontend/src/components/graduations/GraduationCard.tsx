'use client';

import { EventType, trackEvent } from '@/analytics/events';
import { useAuth } from '@/auth/Auth';
import { Graduation } from '@/database/graduation';
import { formatRatingSystem, RatingSystem } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { ChessDojoIcon } from '@/style/ChessDojoIcon';
import { RatingSystemIcon } from '@/style/RatingSystemIcons';
import { SaveAlt } from '@mui/icons-material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { LoadingButton } from '@mui/lab';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { toPng } from 'html-to-image';
import { ForwardedRef, forwardRef, ReactNode, useMemo, useRef } from 'react';
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

interface ReportCanvasProps {
    width?: number | string;
    height?: number | string;
    children: React.ReactElement;
}

const ReportCanvas = forwardRef(function ReportCanvas(
    { children }: ReportCanvasProps,
    ref: ForwardedRef<HTMLDivElement>,
) {
    /*
    const { previousCohort, newCohort, createdAt } = graduation;
    const header = `Welcome to ${newCohort} cohort!`;
    const dateStr = formatDate(createdAt, 'PPP');
    const footer = `Gratuated from the ${previousCohort} band on ${dateStr}`;
        */

    return (
        <Box
            ref={ref}
            display='grid'
            sx={{
                border: 'solid',
                borderColor: 'white',
                width: '800px',
                height: '500px',
                aspectRatio: '1 / 1',
            }}
        >
            {children}
        </Box>
    );
});

interface GraduationCardProps {
    graduation: Graduation;
}

function getChartData(graduation: Graduation): UserSerie<Datum>[] {
    const { ratingSystem: preferredSystem, startedAt } = graduation;

    const ratingHistory =
        graduation.ratingHistories?.[preferredSystem]
            ?.filter(
                (
                    rating, // TODO INVESTIGATE THAT EQUALITY NEEDS TO BE FLIPPED
                ) => rating.date.localeCompare(startedAt) <= 0,
            )
            ?.map(({ date, rating }) => ({ rating, date: new Date(date) })) ?? [];

    return [{ label: 'Rating', data: ratingHistory }];
}

function StatLabel({ children, center }: { children: ReactNode; center?: boolean }) {
    return (
        <Typography
            component='span'
            fontSize='1rem'
            variant='subtitle2'
            color='text.secondary'
            sx={{
                textAlign: center ? 'center' : 'left',
            }}
        >
            {children}
        </Typography>
    );
}

function Stat({
    label,
    value,
    center,
}: {
    label: string;
    value: number | string;
    center?: boolean;
}) {
    return (
        <Stack>
            <StatLabel center={center}>{label}</StatLabel>
            <Typography
                sx={{
                    fontSize: '2.25rem',
                    lineHeight: 1,
                    fontWeight: 'bold',
                    textAlign: center ? 'center' : 'left',
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function RatingStat({ system, value }: { value: number | string; system: RatingSystem }) {
    const systemName = formatRatingSystem(system);

    return (
        <Stack>
            <Stack direction='row' spacing={1.5} alignItems='center'>
                <StatLabel center>
                    {formatRatingSystem(system)}
                    {system === RatingSystem.Custom && systemName && ` (${systemName})`}
                </StatLabel>
            </Stack>
            <Typography
                textAlign='center'
                sx={{
                    fontSize: '2.25rem',
                    lineHeight: 1,
                    fontWeight: 'bold',
                }}
            >
                <RatingSystemIcon system={system} />

                {value}
            </Typography>
        </Stack>
    );
}

function ChangeStat({
    label,
    value,
    center,
}: {
    label: string;
    value: number;
    center?: boolean;
}) {
    return (
        <Stack>
            <StatLabel center={center}>{label}</StatLabel>
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
                    alignContent={center ? 'center' : 'left'}
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

export default function GraduationCard({ graduation }: GraduationCardProps) {
    const {
        newCohort,
        ratingSystem,
        score,
        progress,
        currentRating,
        startRating,
        displayName,
    } = graduation;
    const reportRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();
    const backgroundColor = theme.palette.background.default;
    const dark = !useAuth().user?.enableLightMode;

    const hours =
        Object.values(progress)
            .flatMap((reqProg) => Object.values(reqProg.minutesSpent))
            .reduce((a, b) => a + b, 0) / 60;

    const onDownload = () => {
        const node = reportRef.current;
        if (!node) {
            return;
        }

        // There are potentials CORS issues with AWS
        // https://github.com/bubkoo/html-to-image/issues/40
        // https://stackoverflow.com/questions/42263223/how-do-i-handle-cors-with-html2canvas-and-aws-s3-images
        // https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome
        toPng(node, {
            backgroundColor,
            cacheBust: true,
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `graduation-${newCohort}.png`;
                link.click();

                trackEvent(EventType.DownloadGradBox, {
                    previous_cohort: graduation.previousCohort,
                    new_cohort: graduation.newCohort,
                    dojo_score: graduation.score,
                    graduated_at: graduation.createdAt,
                });
            })
            .catch((error) => {
                console.error('error :-(', error);
            });
    };

    const historyData = useMemo(() => getChartData(graduation), [graduation]);

    const finalRating = currentRating;
    const ratingChange = finalRating - startRating;

    return (
        <Stack>
            <ReportCanvas ref={reportRef}>
                <Box
                    height='100%'
                    display='grid'
                    gap='0.5rem'
                    paddingY='32px'
                    paddingX='64px'
                    gridTemplateColumns='1fr auto'
                    gridTemplateRows='1fr 8fr 2fr'
                    gridTemplateAreas={[
                        '"header blank"',
                        '"chart dojo"',
                        '"stats empty"',
                    ].join('\n')}
                >
                    <Stack
                        direction='column'
                        alignItems='center'
                        justifyContent='center'
                        gridArea='header'
                    >
                        <Typography variant='h5'>
                            Congrats{' '}
                            <Typography
                                variant='h5'
                                component='span'
                                color='dojoOrange.main'
                            >
                                {displayName}
                            </Typography>{' '}
                            on graduating to <CohortIcon size={20} cohort={newCohort} />{' '}
                            {newCohort}!
                        </Typography>
                    </Stack>
                    <Stack
                        direction='row'
                        alignContent='center'
                        justifyContent='space-around'
                        gridArea='stats'
                    >
                        <Stat center label='Start' value={startRating} />
                        <RatingStat system={ratingSystem} value={finalRating} />
                        <ChangeStat center label='Progress' value={ratingChange} />
                    </Stack>

                    <Box display='flex' gridArea='chart'>
                        <Chart
                            options={{
                                data: historyData,
                                primaryAxis,
                                secondaryAxes,
                                dark,
                                interactionMode: 'closest',
                                tooltip: false,
                            }}
                        />
                    </Box>
                    <Stack
                        alignContent='center'
                        justifyContent='center'
                        gridArea='dojo'
                        spacing={2}
                    >
                        <Stat center label='Dojo Points' value={score} />
                        <Stat center label='Dojo Hours' value={hours} />
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
            </ReportCanvas>
            <LoadingButton startIcon={<SaveAlt />} onClick={() => onDownload()}>
                Download Badge
            </LoadingButton>
        </Stack>
    );
}
