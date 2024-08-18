'use client';

import { EventType, trackEvent } from '@/analytics/events';
import { Graduation } from '@/database/graduation';
import { formatRatingSystem } from '@/database/user';
import RatingCard from '@/profile/stats/RatingCard';
import { SaveAlt } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Stack, useTheme } from '@mui/material';
import { toPng } from 'html-to-image';
import { ForwardedRef, forwardRef, useMemo, useRef } from 'react';

interface StatsBreakdownProps {
    graduation: Graduation;
}

function StatsBreakdown({ graduation }: StatsBreakdownProps) {
    const {
        previousCohort,
        ratingSystem: preferredSystem,
        newCohort,
        displayName,
        startedAt,
        createdAt: graduatedAt,
        ratingHistories: allRatingHistories,
    } = graduation;

    const preferredSystemHistory = allRatingHistories?.[preferredSystem];

    const lastImprovementDate = preferredSystemHistory?.reduce((highest, history) =>
        history.rating > highest.rating ? history : highest,
    ).date;

    const ratingHistory = useMemo(() => {
        return (
            preferredSystemHistory?.filter(
                (rating) =>
                    (!lastImprovementDate ||
                        rating.date.localeCompare(lastImprovementDate) <= 0) &&
                    // TODO INVESTIGATE THAT EQUALITY NEEDS TO BE FLIPPED
                    rating.date.localeCompare(startedAt) <= 0,
            ) ?? []
        );
    }, [preferredSystemHistory, lastImprovementDate, startedAt]);

    if (ratingHistory.length <= 0) {
        return <></>;
    }

    const startRating = ratingHistory[0];
    const lastRating = ratingHistory[ratingHistory.length - 1];

    return (
        <RatingCard
            isHistorical={true}
            isPresentationMode={true}
            system={preferredSystem}
            cohort={previousCohort}
            currentRating={lastRating.rating}
            startRating={startRating.rating}
            username={''}
            usernameHidden={true}
            isPreferred={true}
            ratingHistory={ratingHistory}
            name={formatRatingSystem(preferredSystem)}
        />
    );
}

interface GraduationReportProps {
    graduation: Graduation;
}

interface ReportDisplayProps {
    width?: number | string;
    height?: number | string;
    children: React.ReactElement;
}

const ReportDisplay = forwardRef(function ReportDisplay(
    { children }: ReportDisplayProps,
    ref: ForwardedRef<HTMLDivElement>,
) {
    /*
    const { previousCohort, newCohort, createdAt } = graduation;
    const header = `Welcome to ${newCohort} cohort!`;
    const dateStr = formatDate(createdAt, 'PPP');
    const footer = `Gratuated from the ${previousCohort} band on ${dateStr}`;
        */

    return (
        <Box ref={ref} sx={{ aspectRatio: '1.91 / 1' }}>
            {children}
        </Box>
    );
});

export default function GraduationReport({ graduation }: GraduationReportProps) {
    const { newCohort } = graduation;
    const reportRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();
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

    return (
        <>
            <ReportDisplay ref={reportRef}>
                <StatsBreakdown graduation={graduation} />
            </ReportDisplay>
            <Stack direction='row'>
                <LoadingButton startIcon={<SaveAlt />} onClick={() => onDownload()}>
                    Download Badge
                </LoadingButton>
            </Stack>
        </>
    );
}
