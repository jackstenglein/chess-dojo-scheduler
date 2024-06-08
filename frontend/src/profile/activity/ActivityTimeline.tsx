import { Card, CardContent, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { RequestSnackbar } from '../../api/Request';
import { TimelineEntry } from '../../database/timeline';
import { User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import NewsfeedItem from '../../newsfeed/detail/NewsfeedItem';
import NewsfeedItemHeader from '../../newsfeed/detail/NewsfeedItemHeader';
import LoadMoreButton from '../../newsfeed/list/LoadMoreButton';
import { UseTimelineResponse } from './useTimeline';

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

const CreatedAtItem: React.FC<{ user: User }> = ({ user }) => {
    if (!user.createdAt) {
        return null;
    }

    const entry = {
        id: 'createdAt',
        owner: user.username,
        ownerDisplayName: user.displayName,
        createdAt: user.createdAt,
        requirementId: 'CreatedAt',
        requirementName: 'CreatedAt',
        requirementCategory: 'Welcome to the Dojo',
        cohort:
            user.graduationCohorts.length > 0
                ? user.graduationCohorts[0]
                : user.dojoCohort,
    };

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack>
                    <NewsfeedItemHeader entry={entry as TimelineEntry} />
                    <Typography>Joined the Dojo!</Typography>
                </Stack>
            </CardContent>
        </Card>
    );
};

interface ActivityTimelineProps {
    user: User;
    timeline: UseTimelineResponse;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user, timeline }) => {
    const { request, entries, hasMore, onLoadMore, onEdit } = timeline;
    const [numShown, setNumShown] = useState(25);

    if (request.isLoading() && entries.length === 0) {
        return (
            <Stack mt={2}>
                <Typography variant='h5' alignSelf='start'>
                    Timeline
                </Typography>
                <LoadingPage />
            </Stack>
        );
    }

    const handleLoadMore = () => {
        if (numShown < entries.length) {
            setNumShown(numShown + 25);
        } else {
            onLoadMore();
        }
    };

    return (
        <Stack mt={2} spacing={2}>
            <Typography variant='h5' alignSelf='start'>
                Timeline
            </Typography>

            {entries.length === 0 ? (
                <Typography>No events yet</Typography>
            ) : (
                <Stack spacing={3}>
                    {entries.slice(0, numShown).map((entry, i) => (
                        <NewsfeedItem
                            key={entry.id}
                            entry={entry}
                            onEdit={(e) => onEdit(i, e)}
                            maxComments={3}
                        />
                    ))}

                    {(hasMore || numShown < entries.length) && (
                        <LoadMoreButton
                            onLoadMore={handleLoadMore}
                            hasMore={hasMore || numShown < entries.length}
                            request={request}
                        />
                    )}

                    <CreatedAtItem user={user} />
                </Stack>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default ActivityTimeline;
