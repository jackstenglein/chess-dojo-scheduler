import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import Avatar from '../profile/Avatar';
import { TimelineEntry } from '../database/requirement';
import GraduationIcon from '../scoreboard/GraduationIcon';

interface NewsfeedItemHeaderProps {
    entry: TimelineEntry;
}

const NewsfeedItemHeader: React.FC<NewsfeedItemHeaderProps> = ({ entry }) => {
    const createdAt = new Date(entry.createdAt);
    const date = createdAt.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
    });
    const time = createdAt.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar
                    username={entry.owner}
                    displayName={entry.ownerDisplayName}
                    size={60}
                />

                <Stack>
                    <Typography>
                        <Link component={RouterLink} to={`/profile/${entry.owner}`}>
                            {entry.ownerDisplayName}
                        </Link>
                    </Typography>

                    <Typography variant='body2' color='text.secondary'>
                        {date} at {time}
                    </Typography>
                </Stack>
            </Stack>

            {entry.requirementId === 'Graduation' && (
                <Box sx={{ display: { xs: 'none', sm: 'initial' } }}>
                    <GraduationIcon cohort={entry.cohort} size={50} />
                </Box>
            )}
        </Stack>
    );
};

export default NewsfeedItemHeader;
