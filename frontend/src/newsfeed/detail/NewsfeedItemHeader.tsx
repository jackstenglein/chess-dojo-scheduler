import { Link as RouterLink } from 'react-router-dom';
import { Box, Link, Stack, Typography } from '@mui/material';

import Avatar from '../../profile/Avatar';
import { TimelineEntry } from '../../database/timeline';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import { CategoryColors } from '../../profile/activity/activity';

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
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
            flexWrap='wrap'
            rowGap={1}
        >
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

            {entry.requirementId === 'Graduation' ? (
                <Box sx={{ display: { xs: 'none', sm: 'initial' } }}>
                    <GraduationIcon cohort={entry.cohort} size={50} />
                </Box>
            ) : (
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Stack alignItems={{ xs: 'start', sm: 'end' }}>
                        <Typography
                            sx={{ color: CategoryColors[entry.requirementCategory] }}
                        >
                            {entry.requirementCategory}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            {entry.cohort}
                        </Typography>
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
};

export default NewsfeedItemHeader;
