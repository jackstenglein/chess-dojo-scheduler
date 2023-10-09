import { Card, CardContent, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { TimelineEntry } from '../database/requirement';
import Avatar from '../profile/Avatar';

interface NewsfeedItemProps {
    timelineEntry: TimelineEntry;
}

const NewsfeedItem: React.FC<NewsfeedItemProps> = ({ timelineEntry }) => {
    const createdAt = new Date(timelineEntry.createdAt);
    const date = createdAt.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
    });
    const time = createdAt.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack direction='row' spacing={2} alignItems='center'>
                    <Avatar
                        username={timelineEntry.owner}
                        displayName={timelineEntry.ownerDisplayName}
                        size={60}
                    />

                    <Stack>
                        <Typography>
                            <Link
                                component={RouterLink}
                                to={`/profile/${timelineEntry.owner}`}
                            >
                                {timelineEntry.ownerDisplayName}
                            </Link>
                        </Typography>

                        <Typography variant='body2' color='text.secondary'>
                            {date} at {time}
                        </Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default NewsfeedItem;
