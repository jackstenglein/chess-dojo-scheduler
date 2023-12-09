import { Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import Avatar from '../../profile/Avatar';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import { Event } from '../../database/event';

interface ParticipantsListProps {
    event: Event;
    maxItems?: number;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ event, maxItems }) => {
    return (
        <Stack spacing={1}>
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

            {Object.values(event.participants)
                .slice(0, maxItems ? maxItems - 1 : undefined)
                .map((p) => (
                    <Stack
                        key={p.username}
                        direction='row'
                        spacing={1}
                        alignItems='center'
                    >
                        <Avatar
                            username={p.username}
                            displayName={p.displayName}
                            size={25}
                        />
                        <Link component={RouterLink} to={`/profile/${p.username}`}>
                            <Typography variant='body1'>
                                {p.displayName} ({p.cohort})
                            </Typography>
                        </Link>
                        <GraduationIcon cohort={p.previousCohort} size={22} />
                    </Stack>
                ))}
        </Stack>
    );
};

export default ParticipantsList;
