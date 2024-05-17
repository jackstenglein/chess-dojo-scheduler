import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Typography, useTheme } from '@mui/material';

import { SiChessdotcom, SiLichess } from 'react-icons/si';

import { Fragment, useRef } from 'react';
import { Graduation } from '../database/graduation';
import { RatingSystem, formatRatingSystem } from '../database/user';

import { Button } from '@mui/base';
import { toPng } from 'html-to-image';
import { cohortIcons } from '../scoreboard/CohortIcon';

const ratingLogos: Record<string, React.ReactNode> = {
    [RatingSystem.Chesscom]: <SiChessdotcom />,
    [RatingSystem.Lichess]: <SiLichess />,
};

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

const GraduationReport: React.FC<GraduationReportProps> = ({ graduation }) => {
    const { previousCohort, newCohort } = graduation;
    const header = `Welcome to ${newCohort} cohort!`;
    const reportRef = useRef<HTMLElement>();

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
            width: 1080,
            height: 566,
            cacheBust: true,
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `graduation-${newCohort}.png`;
                link.click();
            })
            .catch((error) => {
                console.error('error :-(', error.type);
            });
    };

    return (
        <>
            <Button onClick={onDownload}>Download</Button>
            <Box
                id={`graduation-report-${Date.parse(graduation.createdAt)}`}
                ref={reportRef}
                display='grid'
                gap='0.75rem'
                gridTemplateAreas={{
                    xs: '"header header" "newCohortImage content" "newCohortImage content" "newCohortBand footer"',
                }}
                sx={{
                    aspectRatio: '16/9',
                    width: '420px',
                    overflow: 'auto',
                    height: 'auto',
                }}
            >
                <Typography gridArea='header' textAlign='center' variant='h5'>
                    {header}
                </Typography>
                <Box
                    component='img'
                    sx={{
                        width: '100%',
                        maxHeight: '100%',
                    }}
                    gridArea='newCohortImage'
                    src={cohortIcons[newCohort]}
                />
                <Typography
                    gridArea='newCohortBand'
                    textAlign='center'
                    variant='subtitle2'
                    color='text.primary'
                >
                    {newCohort}
                </Typography>

                <Box
                    gridArea='content'
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                >
                    <StatsBreakdown graduation={graduation} />
                </Box>
                <Typography gridArea='footer' variant='caption'>
                    Gratuated from the {previousCohort} band on May 14th, 2024
                </Typography>
            </Box>
        </>
    );
};

export default GraduationReport;
