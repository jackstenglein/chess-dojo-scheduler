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
import { Typography } from '@mui/material';
import { useMemo } from 'react';
import {
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../../database/requirement';

import { User } from '../../database/user';
import { CategoryColors } from './activity';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
};

function getTimeSpent(timelineItem: RequirementProgress): string {
    if (timelineItem.minutesSpent.length === 0) {
        return '';
    }
    const minutesSpent = Object.values(timelineItem.minutesSpent)[0];
    const hours = Math.floor(minutesSpent / 60);
    const minutes = minutesSpent % 60;
    if (hours === 0 && minutes === 0) {
        return '';
    }
    return `${hours}h ${minutes}m`;
}

interface ActivityTimelineProps {
    user: User;
    requirements: Record<string, Requirement>;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user, requirements }) => {
    console.log('Timeline: ', user.timeline);

    const timeline = useMemo(() => {
        const result = [];
        for (let i = user.timeline.length - 1; i >= 0; i--) {
            const date = new Date(user.timeline[i].updatedAt);
            const requirement = requirements[user.timeline[i].requirementId];

            if (!requirement) {
                continue;
            }

            const isCheckbox =
                requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox ||
                requirement.scoreboardDisplay === ScoreboardDisplay.Hidden;

            const timeSpent = getTimeSpent(user.timeline[i]);

            result.push(
                <TimelineItem>
                    <TimelineOppositeContent>
                        {date.toLocaleDateString(undefined, DATE_OPTIONS)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                        <TimelineDot
                            sx={{ backgroundColor: CategoryColors[requirement.category] }}
                        />
                        {(i > 0 || user.createdAt) && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                        <Typography variant='subtitle1' component='span'>
                            {isCheckbox ? 'Completed' : 'Updated'} {requirement.name}
                        </Typography>
                        {timeSpent && (
                            <Typography variant='subtitle2'>{timeSpent}</Typography>
                        )}
                    </TimelineContent>
                </TimelineItem>
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
    }, [user.timeline, user.createdAt, requirements]);

    if (user.timeline.length === 0) {
        return null;
    }

    return (
        <Timeline
            sx={{
                [`& .${timelineOppositeContentClasses.root}`]: {
                    paddingLeft: 0,
                    flex: 0,
                },
            }}
        >
            {timeline}
        </Timeline>
    );
};

export default ActivityTimeline;
