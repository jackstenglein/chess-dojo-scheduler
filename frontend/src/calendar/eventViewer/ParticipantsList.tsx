import { Link, Stack, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import Avatar from '../../profile/Avatar';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import { Event } from '../../database/event';
import { useAuth } from '../../auth/Auth';
import { Warning } from '@mui/icons-material';

interface ParticipantsListProps {
    event: Event;
    maxItems?: number;
    showPaymentWarning?: boolean;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
    event,
    maxItems,
    showPaymentWarning,
}) => {
    const user = useAuth().user;

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

                        {showPaymentWarning &&
                            !p.hasPaid &&
                            (user?.username === event.owner ||
                                user?.username === p.username) && (
                                <Tooltip
                                    title={
                                        user.username === event.owner
                                            ? 'This user has not paid and will lose their booking in <30 min'
                                            : 'You have not completed payment and will lose your booking soon'
                                    }
                                >
                                    <Warning color='warning' />
                                </Tooltip>
                            )}
                    </Stack>
                ))}
        </Stack>
    );
};

export default ParticipantsList;
