import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent,
    timelineOppositeContentClasses,
    TimelineOppositeContent,
    LoadingButton,
} from '@mui/lab';
import { Stack, Typography } from '@mui/material';

import { RequestSnackbar } from '../../api/Request';
import { ScoreboardDisplay } from '../../database/requirement';
import { TimelineEntry } from '../../database/timeline';
import { User } from '../../database/user';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import { CategoryColors } from './activity';
import { UseTimelineResponse } from './useTimeline';
import LoadingPage from '../../loading/LoadingPage';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
};

export function getTimeSpent(timelineItem: TimelineEntry): string {
    if (timelineItem.minutesSpent === 0) {
        return '';
    }
    const hours = Math.floor(timelineItem.minutesSpent / 60);
    const minutes = timelineItem.minutesSpent % 60;
    if (hours === 0 && minutes === 0) {
        return '';
    }
    return `${hours}h ${minutes}m`;
}

function getProgressItem(entry: TimelineEntry, showConnector: boolean) {
    const date = new Date(entry.date || entry.createdAt);
    const isCheckbox =
        entry.scoreboardDisplay === ScoreboardDisplay.Checkbox ||
        entry.scoreboardDisplay === ScoreboardDisplay.Hidden;
    const isSlider =
        entry.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        entry.scoreboardDisplay === ScoreboardDisplay.Unspecified;
    const isComplete = entry.newCount >= entry.totalCount;
    const timeSpent = getTimeSpent(entry);

    let description = 'Updated';
    if (isComplete) {
        description = 'Completed';
    } else if (isCheckbox) {
        description = 'Unchecked';
    }

    return (
        <TimelineItem key={`${entry.requirementId}-${entry.createdAt}-${entry.newCount}`}>
            <TimelineOppositeContent>
                {date.toLocaleDateString(undefined, DATE_OPTIONS)}
            </TimelineOppositeContent>
            <TimelineSeparator>
                <TimelineDot
                    sx={{
                        backgroundColor: CategoryColors[entry.requirementCategory],
                    }}
                />
                {showConnector && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
                <Typography variant='subtitle1' component='span'>
                    {description} {entry.requirementName}
                </Typography>
                {isSlider && (
                    <ScoreboardProgress
                        value={entry.newCount}
                        min={0}
                        max={entry.totalCount}
                        suffix={entry.progressBarSuffix}
                    />
                )}
                {timeSpent && <Typography variant='subtitle2'>{timeSpent}</Typography>}
            </TimelineContent>
        </TimelineItem>
    );
}

function getGraduationItem(entry: TimelineEntry, showConnector: boolean) {
    const date = new Date(entry.createdAt);

    return (
        <TimelineItem key={entry.createdAt}>
            <TimelineOppositeContent>
                {date.toLocaleDateString(undefined, DATE_OPTIONS)}
            </TimelineOppositeContent>
            <TimelineSeparator>
                <TimelineDot
                    sx={{
                        backgroundColor: CategoryColors.Graduation,
                    }}
                />
                {showConnector && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
                <Stack direction='row' alignItems='center' spacing={1}>
                    <Stack>
                        <Typography variant='subtitle1' component='span'>
                            Graduated from {entry.cohort}
                        </Typography>
                    </Stack>
                    <GraduationIcon cohort={entry.cohort} size={30} />
                </Stack>
            </TimelineContent>
        </TimelineItem>
    );
}

function getTimelineItem(entry: TimelineEntry, showConnector: boolean) {
    if (entry.requirementCategory === 'Graduation') {
        return getGraduationItem(entry, showConnector);
    }

    return getProgressItem(entry, showConnector);
}

function getCreatedAtItem(createdAt: string) {
    const date = new Date(createdAt);

    return (
        <TimelineItem key={createdAt}>
            <TimelineOppositeContent>
                {date.toLocaleDateString(undefined, DATE_OPTIONS)}
            </TimelineOppositeContent>
            <TimelineSeparator>
                <TimelineDot
                    sx={{
                        backgroundColor: CategoryColors['Welcome to the Dojo'],
                    }}
                />
            </TimelineSeparator>
            <TimelineContent>Joined the Dojo</TimelineContent>
        </TimelineItem>
    );
}

interface ActivityTimelineProps {
    user: User;
    timeline: UseTimelineResponse;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user, timeline }) => {
    const { request, entries, hasMore, onLoadMore } = timeline;

    if (request.isLoading() && entries.length === 0) {
        return (
            <Stack>
                <Typography variant='h6' alignSelf='start'>
                    Timeline
                </Typography>
                <LoadingPage />
            </Stack>
        );
    }

    return (
        <Stack>
            <Typography variant='h6' alignSelf='start'>
                Timeline
            </Typography>

            {entries.length === 0 ? (
                <Typography>No events yet</Typography>
            ) : (
                <Timeline
                    sx={{
                        [`& .${timelineOppositeContentClasses.root}`]: {
                            paddingLeft: 0,
                            flex: 0,
                        },
                        marginTop: 0,
                        paddingTop: '8px',
                    }}
                >
                    {entries.map((td, i) =>
                        getTimelineItem(
                            td,
                            i < entries.length - 1 || user.createdAt !== ''
                        )
                    )}

                    {hasMore && (
                        <Stack
                            width='fit-content'
                            height='84px'
                            justifyContent='start'
                            alignItems='center'
                            mx={3.1}
                        >
                            <TimelineConnector />
                            <LoadingButton
                                variant='outlined'
                                sx={{ alignSelf: 'center', my: 1 }}
                                loading={request.isLoading()}
                                onClick={onLoadMore}
                            >
                                Load More
                            </LoadingButton>
                            <TimelineConnector />
                        </Stack>
                    )}

                    {user.createdAt && getCreatedAtItem(user.createdAt)}
                </Timeline>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default ActivityTimeline;
