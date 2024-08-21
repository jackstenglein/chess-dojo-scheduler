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
import { domToPng } from 'modern-screenshot';
import {
    ForwardedRef,
    forwardRef,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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
    return (
        <Box
            ref={ref}
            display='grid'
            sx={{
                width: '800px',
                height: '500px',
            }}
        >
            {children}
        </Box>
    );
});

function getChartData(graduation: Graduation): UserSerie<Datum>[] {
    const { ratingSystem: preferredSystem } = graduation;

    const ratingHistory =
        graduation.ratingHistories?.[preferredSystem]?.map(({ date, rating }) => ({
            rating,
            date: new Date(date),
        })) ?? [];

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

interface GraduationCardProps {
    graduation: Graduation;
}

export default function GraduationCard({ graduation }: GraduationCardProps) {
    const { newCohort } = graduation;
    const reportRef = useRef<HTMLDivElement>(null);
    const [imageData, setImageData] = useState<string>();

    const theme = useTheme();
    const backgroundColor = theme.palette.background.default;

    const renderImage = () => {
        const node = reportRef.current;
        if (!node) {
            return;
        }

        // There are potentials CORS issues with AWS
        // https://github.com/bubkoo/html-to-image/issues/40
        // https://stackoverflow.com/questions/42263223/how-do-i-handle-cors-with-html2canvas-and-aws-s3-images
        // https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome
        domToPng(node, { quality: 1, backgroundColor })
            .then((dataUrl) => {
                setImageData(dataUrl);
            })
            .catch((error) => {
                console.error('domToPng: ', error);
            });
    };

    useEffect(() => {
        renderImage();
    });

    const onDownload = () => {
        if (!imageData) {
            return;
        }
        trackEvent(EventType.DownloadGradBox, {
            previous_cohort: graduation.previousCohort,
            new_cohort: graduation.newCohort,
            dojo_score: graduation.score,
            graduated_at: graduation.createdAt,
        });

        const link = document.createElement('a');
        link.href = imageData;
        link.download = `graduation-${newCohort}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Stack>
            <ReportCanvas>
                <GraduationCardDisplay graduation={graduation} />
            </ReportCanvas>
            {imageData ? (
                <Stack>
                    <img src={imageData} alt='Preview of graduation image' />
                    <LoadingButton startIcon={<SaveAlt />} onClick={onDownload}>
                        Download Badge
                    </LoadingButton>
                </Stack>
            ) : (
                <ReportCanvas ref={reportRef}>
                    <GraduationCardDisplay graduation={graduation} />
                </ReportCanvas>
            )}
        </Stack>
    );
}

export function GraduationCardDisplay({ graduation }: GraduationCardProps) {
    const {
        newCohort,
        ratingSystem,
        score,
        progress,
        currentRating,
        startRating,
        displayName,
    } = graduation;

    const dark = !useAuth().user?.enableLightMode;

    const hours =
        Object.values(progress)
            .flatMap((reqProg) => Object.values(reqProg.minutesSpent))
            .reduce((a, b) => a + b, 0) / 60;

    const historyData = useMemo(() => getChartData(graduation), [graduation]);

    const finalRating = currentRating;
    const ratingChange = finalRating - startRating;

    return (
        <Box
            height='100%'
            display='grid'
            gap='0.5rem'
            paddingY='32px'
            paddingX='64px'
            gridTemplateColumns='1fr auto'
            gridTemplateRows='auto max-content auto'
            gridTemplateAreas={['"header blank"', '"chart dojo"', '"stats empty"'].join(
                '\n',
            )}
        >
            <Stack
                direction='row'
                flexWrap='wrap'
                justifyContent='center'
                alignItems='center'
                columnGap='1ch'
                gridArea='header'
            >
                <Box>
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
                        <Typography lineHeight={1} variant='h5'>
                            {newCohort}!
                        </Typography>
                    </Stack>
                </Box>
                <CohortIcon size={40} cohort={newCohort} />
            </Stack>
            <Stack
                direction='row'
                alignContent='center'
                justifyContent='space-around'
                gridArea='stats'
            >
                <RatingStat system={ratingSystem} value={finalRating} />
                <Stat center label='Start' value={startRating} />
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
                <Stat center label='Dojo Points' value={Math.round(100 * score) / 100} />
                <Stat center label='Dojo Hours' value={Math.round(10 * hours) / 10} />
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
