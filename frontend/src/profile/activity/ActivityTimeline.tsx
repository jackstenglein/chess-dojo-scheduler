import { Card, CardContent, Stack, Typography } from '@mui/material';

import { RequestSnackbar } from '../../api/Request';
import { TimelineEntry } from '../../database/timeline';
import { User } from '../../database/user';
import { UseTimelineResponse } from './useTimeline';
import LoadingPage from '../../loading/LoadingPage';
import { useAuth } from '../../auth/Auth';
import NewsfeedItem from '../../newsfeed/detail/NewsfeedItem';
import LoadMoreButton from '../../newsfeed/list/LoadMoreButton';
import NewsfeedItemHeader from '../../newsfeed/detail/NewsfeedItemHeader';

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

const CreatedAtItem: React.FC<{ user: User; viewer?: User }> = ({ user, viewer }) => {
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
            user.graduationCohorts?.length > 0
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
    const viewer = useAuth().user;
    const { request, entries, hasMore, onLoadMore, onEdit } = timeline;

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

    return (
        <Stack mt={2} spacing={2}>
            <Typography variant='h5' alignSelf='start'>
                Timeline
            </Typography>

            {entries.length === 0 ? (
                <Typography>No events yet</Typography>
            ) : (
                <Stack spacing={3}>
                    {entries.map((entry, i) => (
                        <NewsfeedItem
                            key={entry.id}
                            entry={entry}
                            onEdit={(e) => onEdit(i, e)}
                            maxComments={3}
                        />
                    ))}

                    {hasMore && (
                        <LoadMoreButton
                            onLoadMore={onLoadMore}
                            hasMore={hasMore}
                            request={request}
                        />
                    )}

                    <CreatedAtItem user={user} viewer={viewer} />
                </Stack>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default ActivityTimeline;
