import { useEffect, useMemo } from 'react';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent,
    timelineOppositeContentClasses,
    TimelineOppositeContent,
} from '@mui/lab';
import { Stack, Typography } from '@mui/material';

import { useApi } from '../../api/Api';
import { useRequest } from '../../api/Request';
import { Graduation, isGraduation } from '../../database/graduation';
import { ScoreboardDisplay, TimelineEntry } from '../../database/requirement';
import { User } from '../../database/user';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import { CategoryColors } from './activity';

type TimelineData = TimelineEntry | Graduation;

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
};

function getTimeSpent(timelineItem: TimelineEntry): string {
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

function getTimelineEntryItem(timelineEntry: TimelineEntry, showConnector: boolean) {
    const date = new Date(timelineEntry.createdAt);
    const isCheckbox =
        timelineEntry.scoreboardDisplay === ScoreboardDisplay.Checkbox ||
        timelineEntry.scoreboardDisplay === ScoreboardDisplay.Hidden;
    const isSlider =
        timelineEntry.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        timelineEntry.scoreboardDisplay === ScoreboardDisplay.Unspecified;
    const isComplete = timelineEntry.newCount >= timelineEntry.totalCount;
    const timeSpent = getTimeSpent(timelineEntry);

    let description = 'Updated';
    if (isComplete) {
        description = 'Completed';
    } else if (isCheckbox) {
        description = 'Unchecked';
    }

    return (
        <TimelineItem
            key={`${timelineEntry.requirementId}-${timelineEntry.createdAt}-${timelineEntry.newCount}`}
        >
            <TimelineOppositeContent>
                {date.toLocaleDateString(undefined, DATE_OPTIONS)}
            </TimelineOppositeContent>
            <TimelineSeparator>
                <TimelineDot
                    sx={{
                        backgroundColor:
                            CategoryColors[timelineEntry.requirementCategory],
                    }}
                />
                {showConnector && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
                <Typography variant='subtitle1' component='span'>
                    {description} {timelineEntry.requirementName}
                </Typography>
                {isSlider && (
                    <ScoreboardProgress
                        value={timelineEntry.newCount}
                        min={0}
                        max={timelineEntry.totalCount}
                        suffix={timelineEntry.progressBarSuffix}
                    />
                )}
                {timeSpent && <Typography variant='subtitle2'>{timeSpent}</Typography>}
            </TimelineContent>
        </TimelineItem>
    );
}

function getGraduationItem(graduation: Graduation, showConnector: boolean) {
    const date = new Date(graduation.createdAt);

    return (
        <TimelineItem key={graduation.createdAt}>
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
                            Graduated from {graduation.previousCohort}
                        </Typography>
                        <Typography variant='subtitle2'>
                            Dojo Score: {Math.round(graduation.score * 100) / 100}
                        </Typography>
                    </Stack>
                    <GraduationIcon cohort={graduation.previousCohort} size={30} />
                </Stack>
            </TimelineContent>
        </TimelineItem>
    );
}

function getTimelineItem(data: TimelineData, showConnector: boolean) {
    if (isGraduation(data)) {
        return getGraduationItem(data, showConnector);
    }
    return getTimelineEntryItem(data, showConnector);
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
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user }) => {
    const graduationRequest = useRequest<Graduation[]>();
    const api = useApi();

    useEffect(() => {
        if (!graduationRequest.isSent()) {
            graduationRequest.onStart();
            api.listGraduationsByOwner(user.username)
                .then((graduations) => graduationRequest.onSuccess(graduations))
                .catch((err) => {
                    console.error('listGraduationsByOwner: ', err);
                    graduationRequest.onFailure(err);
                });
        }
    }, [graduationRequest, api, user.username]);

    const timelineData: TimelineData[] = useMemo(() => {
        return (user.timeline as TimelineData[])
            .concat(graduationRequest.data ?? [])
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }, [graduationRequest.data, user.timeline]);

    const timeline = useMemo(() => {
        const result = [];
        for (let i = timelineData.length - 1; i >= 0; i--) {
            result.push(getTimelineItem(timelineData[i], i > 0 || user.createdAt !== ''));
        }
        if (user.createdAt) {
            result.push(getCreatedAtItem(user.createdAt));
        }
        return result;
    }, [timelineData, user.createdAt]);

    return (
        <Stack>
            <Typography variant='h6' alignSelf='start'>
                Timeline
            </Typography>
            {user.timeline.length === 0 ? (
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
                    {timeline}
                </Timeline>
            )}
        </Stack>
    );
};

export default ActivityTimeline;
