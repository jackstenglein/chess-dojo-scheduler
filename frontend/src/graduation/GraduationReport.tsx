import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Typography } from '@mui/material';

import { SiChessdotcom, SiLichess } from 'react-icons/si';

import { useRef } from 'react';
import { Graduation } from '../database/graduation';
import { RatingSystem, formatRatingSystem } from '../database/user';

import { Button } from '@mui/base';
import { toJpeg } from 'html-to-image';

const ratingLogos: Record<string, React.ReactNode> = {
    [RatingSystem.Chesscom]: <SiChessdotcom />,
    [RatingSystem.Lichess]: <SiLichess />,
};

function getCohortIcon(band: string) {
    return `https://chess-dojo-images.s3.amazonaws.com/icons/v3/${band}.png`;
}

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
                <>
                    <div
                        style={{ display: 'flex', alignItems: 'center' }}
                        key={`logo-${system}`}
                    >
                        {ratingLogos[system] ?? ''}
                    </div>
                    <div
                        style={{ display: 'flex', alignItems: 'center' }}
                        key={`system-${system}`}
                    >
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
                </>
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

    const onExport = () => {
        const node = reportRef?.current;
        if (!node) {
            return;
        }
        console.log(node);

        toJpeg(node, { cacheBust: true })
            .then((dataUrl) => {
                console.log(dataUrl);
                /*var img = new Image();
                img.src = dataUrl;
                document.body.appendChild(img);*/
            })
            .catch((error) => {
                // If this is happening unexpectedly, maybe related to this:
                // https://github.com/tsayen/dom-to-image/issues/243
                console.error('error :-(', error.type);
            });
    };

    return (
        <>
            <Button onClick={onExport}>Export</Button>
            <Box
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
                    src={getCohortIcon(newCohort)}
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
