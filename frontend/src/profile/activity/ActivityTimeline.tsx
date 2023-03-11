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
import { useMemo } from 'react';
import { ScoreboardDisplay, TimelineEntry } from '../../database/requirement';

import { User } from '../../database/user';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import { CategoryColors } from './activity';

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

function getTimelineItem(timelineEntry: TimelineEntry, showConnector: boolean) {
    const date = new Date(timelineEntry.createdAt);
    const isCheckbox =
        timelineEntry.scoreboardDisplay === ScoreboardDisplay.Checkbox ||
        timelineEntry.scoreboardDisplay === ScoreboardDisplay.Hidden;
    const isComplete = timelineEntry.newCount >= timelineEntry.totalCount;
    const timeSpent = getTimeSpent(timelineEntry);

    return (
        <TimelineItem>
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
                    {isCheckbox || isComplete ? 'Completed' : 'Updated'}{' '}
                    {timelineEntry.requirementName}
                </Typography>
                {!isCheckbox && (
                    <ScoreboardProgress
                        value={timelineEntry.newCount}
                        min={0}
                        max={timelineEntry.totalCount}
                    />
                )}
                {timeSpent && <Typography variant='subtitle2'>{timeSpent}</Typography>}
            </TimelineContent>
        </TimelineItem>
    );
}

interface ActivityTimelineProps {
    user: User;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user }) => {
    console.log('Timeline: ', user.timeline);

    const timeline = useMemo(() => {
        const result = [];
        for (let i = user.timeline.length - 1; i >= 0; i--) {
            result.push(
                getTimelineItem(user.timeline[i], i > 0 || user.createdAt !== '')
            );
        }
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            result.push(
                <TimelineItem>
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

        return result;
    }, [user.timeline, user.createdAt]);

    if (user.timeline.length === 0) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6' alignSelf='start'>
                Timeline
            </Typography>
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
        </Stack>
    );
};

export default ActivityTimeline;
