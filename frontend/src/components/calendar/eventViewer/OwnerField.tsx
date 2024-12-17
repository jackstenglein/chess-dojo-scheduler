import { Event } from '@/database/event';
import Avatar from '@/profile/Avatar';
import CohortIcon from '@/scoreboard/CohortIcon';
import Icon from '@/style/Icon';
import { Link, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';

interface OwnerFieldProps {
    title: string;
    event: Event;
}

const OwnerField: React.FC<OwnerFieldProps> = ({ title, event }) => {
    return (
        <Stack>
            <Typography variant='h6' color='text.secondary'>
                <Icon
                    name='player'
                    color='primary'
                    sx={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
                />
                {title}
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center'>
                <Avatar
                    username={event.owner}
                    displayName={event.ownerDisplayName}
                    size={25}
                />
                <Link component={NextLink} href={`/profile/${event.owner}`}>
                    <Typography variant='body1'>
                        {event.ownerDisplayName} ({event.ownerCohort})
                    </Typography>
                </Link>
                <CohortIcon cohort={event.ownerPreviousCohort} size={22} />
            </Stack>
        </Stack>
    );
};

export default OwnerField;
