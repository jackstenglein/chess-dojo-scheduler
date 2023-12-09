import { Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { Event } from '../../database/event';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import Avatar from '../../profile/Avatar';

interface OwnerFieldProps {
    title: string;
    event: Event;
}

const OwnerField: React.FC<OwnerFieldProps> = ({ title, event }) => {
    return (
        <Stack>
            <Typography variant='subtitle2' color='text.secondary'>
                {title}
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center'>
                <Avatar
                    username={event.owner}
                    displayName={event.ownerDisplayName}
                    size={25}
                />
                <Link component={RouterLink} to={`/profile/${event.owner}`}>
                    <Typography variant='body1'>
                        {event.ownerDisplayName} ({event.ownerCohort})
                    </Typography>
                </Link>
                <GraduationIcon cohort={event.ownerPreviousCohort} size={22} />
            </Stack>
        </Stack>
    );
};

export default OwnerField;
