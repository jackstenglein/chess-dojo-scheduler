'use client';

import { Graduation } from '@/database/graduation';
import { RatingSystem, formatRatingSystem } from '@/database/user';
import { cohortIcons } from '@/scoreboard/CohortIcon';
import { SaveAlt } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { LoadingButton } from '@mui/lab';
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import { toPng } from 'html-to-image';
import { ForwardedRef, Fragment, forwardRef, useRef } from 'react';
import { SiChessdotcom, SiLichess } from 'react-icons/si';

const ratingLogos: Record<string, React.ReactNode> = {
    [RatingSystem.Chesscom]: <SiChessdotcom />,
    [RatingSystem.Lichess]: <SiLichess />,
};

const ReportHeight = 566;
const ReportWidth = 1080;

interface StatsBreakdownProps {
    graduation: Graduation;
}

const StatsBreakdown: React.FC<StatsBreakdownProps> = ({ graduation }) => {
    const stats = {
        'Dojo Score': {
            diff: false,
            value: graduation.score,
        },
        [graduation.ratingSystem]: {
            diff: true,
            value: graduation.currentRating - graduation.startRating,
        },
    };

    return (
        <Box
            display='grid'
            gridTemplateColumns='auto auto 1fr'
            gridAutoRows='min-content'
            rowGap='0.25rem'
            columnGap='0.50rem'
        >
            {Object.entries(stats).map(([system, stat]) => (
                <Fragment key={system}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {ratingLogos[system] ?? ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Typography>{formatRatingSystem(system)}</Typography>
                    </div>
                    <Typography
                        sx={{ display: 'flex', alignItems: 'center' }}
                        key={`diff-${system}`}
                    >
                        <ArrowUpwardIcon
                            sx={{
                                fontWeight: 'bold',
                                visibility: stat.diff ? 'visible' : 'hidden',
                            }}
                            color='success'
                        />
                        {stat.value}
                    </Typography>
                </Fragment>
            ))}
        </Box>
    );
};

interface GraduationReportProps {
    graduation: Graduation;
}

type GraduationReportDisplayProps = GraduationReportProps & {
    width?: number | string;
    height?: number | string;
};

const GraduationReportDisplay = forwardRef(function GraduationReportDisplay(
    { graduation, width, height }: GraduationReportDisplayProps,
    ref: ForwardedRef<HTMLDivElement>,
) {
    const { previousCohort, newCohort } = graduation;
    const header = `Welcome to ${newCohort} cohort!`;
    const footer = `Gratuated from the ${previousCohort} band on May 14th, 2024`;

    return (
        <Card ref={ref} sx={{ width, height, maxWidth: '420px' }}>
            <CardContent>
                <Box
                    display='grid'
                    gap='0.75rem'
                    gridTemplateColumns='1fr 1fr 1fr'
                    gridTemplateRows='auto 1fr 1fr auto'
                >
                    <Typography
                        gridColumn='1 / span 3'
                        gridRow='1'
                        textAlign='center'
                        variant='h5'
                    >
                        {header}
                    </Typography>
                    <Box
                        gridColumn='1'
                        gridRow='2 / span 2'
                        component='img'
                        sx={{
                            width: '100%',
                            maxHeight: '100%',
                        }}
                        src={cohortIcons[newCohort]}
                    />
                    <Box
                        gridColumn='2 / span 2'
                        gridRow='2 / span 2'
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                    >
                        <StatsBreakdown graduation={graduation} />
                    </Box>
                    <Typography
                        gridColumn='1 / span 3'
                        gridRow='4'
                        variant='caption'
                        textAlign='center'
                    >
                        {footer}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
});

const GraduationReport = ({ graduation }: GraduationReportProps) => {
    const { newCohort } = graduation;
    const reportRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();
    // TODO: Before merge, only access the darkmode pallette
    const backgroundColor = theme.palette.background.default;

    const onDownload = () => {
        const node = reportRef.current;
        if (!node) {
            return;
        }

        // There are potentials CORS issues with AWS
        // https://github.com/bubkoo/html-to-image/issues/40
        // https://stackoverflow.com/questions/42263223/how-do-i-handle-cors-with-html2canvas-and-aws-s3-images
        // https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome

        // TODO before merge, higher resolution, 1080x566 would e ideal for 16/9.
        //      setting width/height here does not expand the element. We may need to
        //      manually increase the resolution.
        toPng(node, {
            backgroundColor,
            width: ReportWidth,
            height: ReportHeight,
            cacheBust: true,
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `graduation-${newCohort}.png`;
                link.click();
            })
            .catch((error) => {
                console.error('error :-(', error);
            });
    };

    return (
        <>
            <Stack alignItems='center'>
                <Box>
                    <GraduationReportDisplay graduation={graduation} />
                </Box>
                <Stack direction='row'>
                    <LoadingButton startIcon={<SaveAlt />} onClick={() => onDownload()}>
                        Download Badge
                    </LoadingButton>
                </Stack>
            </Stack>
            <Box display='none'>
                <GraduationReportDisplay
                    ref={reportRef}
                    graduation={graduation}
                    width={ReportWidth}
                    height={ReportHeight}
                />
            </Box>
        </>
    );
};

export default GraduationReport;
